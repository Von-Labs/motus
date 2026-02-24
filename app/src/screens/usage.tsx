import { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ThemeContext, AppContext } from '../context'
import { useHotWallet } from '../context/HotWalletContext'
import { signAndSendTransactionFromBase64 } from '../utils/transactionSigner'
import { DOMAIN } from '../../constants'

const MIN_DEPOSIT = 5

interface UserStats {
  user: {
    wallet_address: string
    free_requests_remaining: number
    usdc_balance: string
    total_spent: string
    created_at: string
  }
  stats: {
    totalRequests: number
    freeRequests: number
    paidRequests: number
    totalTokens: number
    totalCost: number
    freeRequestsRemaining: number
  }
}

interface UsageRecord {
  id: string
  model: string
  request_type: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  total_cost: string
  is_free_request: boolean
  created_at: string
  endpoint: string
}

export function Usage() {
  const { theme } = useContext(ThemeContext)
  const { walletAddress } = useContext(AppContext)
  const {
    isHotWalletActive,
    publicKey: hotWalletPublicKey,
    signAndSendTransaction,
    requireBalance,
  } = useHotWallet()
  const styles = getStyles(theme)

  const depositWalletAddress =
    isHotWalletActive && hotWalletPublicKey
      ? hotWalletPublicKey
      : walletAddress

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('10')
  const [depositing, setDepositing] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)

  useEffect(() => {
    if (depositWalletAddress) {
      fetchData()
    } else {
      setLoading(false)
      setError('No wallet connected')
    }
  }, [depositWalletAddress])

  const fetchData = async () => {
    try {
      setError(null)

      if (!depositWalletAddress) {
        setError('No wallet connected')
        setLoading(false)
        return
      }

      const [statsResponse, usageResponse] = await Promise.all([
        fetch(`${DOMAIN}/api/user/stats`, {
          headers: { 'X-Wallet-Address': depositWalletAddress },
        }),
        fetch(`${DOMAIN}/api/user/usage?limit=50`, {
          headers: { 'X-Wallet-Address': depositWalletAddress },
        }),
      ])

      if (!statsResponse.ok) throw new Error('Failed to fetch stats')
      if (!usageResponse.ok) throw new Error('Failed to fetch usage')

      const statsData = await statsResponse.json()
      const usageData = await usageResponse.json()
      setStats(statsData)
      setUsage(usageData.usage || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  /**
   * Deposit flow (mirrors swap flow):
   * 1. Call server /deposit/prepare → get unsigned tx (base64)
   * 2. MWA transact() → sign & send via Phantom
   * 3. Call server /deposit with signature → verify on-chain & credit balance
   */
  const handleDeposit = async () => {
    if (!depositWalletAddress) {
      Alert.alert('Error', 'No wallet connected')
      return
    }

    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < MIN_DEPOSIT) {
      Alert.alert('Error', `Minimum deposit is $${MIN_DEPOSIT} USDC`)
      return
    }

    setDepositing(true)
    try {
      const prepareRes = await fetch(`${DOMAIN}/api/user/deposit/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': depositWalletAddress,
        },
        body: JSON.stringify({ amount }),
      })

      if (!prepareRes.ok) {
        const err = await prepareRes.json()
        throw new Error(err.message || 'Failed to prepare deposit transaction')
      }

      const { transaction: txBase64 } = await prepareRes.json()

      const { signature: txSignature } = await signAndSendTransactionFromBase64(
        txBase64,
        {
          cluster: 'mainnet-beta',
          hotWallet: isHotWalletActive
            ? {
                useHotWallet: true,
                signAndSendTransaction,
                requireBalance,
              }
            : null,
        },
      )

      const verifyRes = await fetch(`${DOMAIN}/api/user/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': depositWalletAddress,
        },
        body: JSON.stringify({ signature: txSignature }),
      })

      const result = await verifyRes.json()

      if (!verifyRes.ok) {
        throw new Error(result.message || 'Deposit verification failed')
      }

      Alert.alert(
        'Success',
        `Deposited $${result.amount?.toFixed(2)} USDC successfully!`,
        [{ text: 'OK', onPress: () => { setShowDeposit(false); fetchData() } }]
      )
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCost = (cost: string) => `$${parseFloat(cost).toFixed(4)}`

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tintColor} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tintColor} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Free Requests</Text>
          <Text style={styles.statValue}>{stats?.stats?.freeRequestsRemaining ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>USDC Balance</Text>
          <Text style={styles.statValue}>
            ${parseFloat(stats?.user?.usdc_balance || '0').toFixed(2)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValue}>
            ${parseFloat(stats?.user?.total_spent || '0').toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Deposit Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.depositToggleButton}
          onPress={() => setShowDeposit(!showDeposit)}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.backgroundColor} />
          <Text style={styles.depositToggleText}>Deposit USDC</Text>
          <Ionicons
            name={showDeposit ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.backgroundColor}
          />
        </TouchableOpacity>

        {showDeposit && (
          <View style={styles.depositCard}>
            <Text style={styles.depositTitle}>Deposit USDC</Text>
            <Text style={styles.depositSubtitle}>
              Minimum deposit: ${MIN_DEPOSIT} USDC
            </Text>

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Amount (USDC)</Text>
            <TextInput
              style={styles.amountInput}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor={theme.secondaryTextColor}
            />

            <TouchableOpacity
              style={[styles.submitButton, depositing && styles.submitButtonDisabled]}
              onPress={handleDeposit}
              disabled={depositing}
            >
              {depositing ? (
                <ActivityIndicator size="small" color={theme.backgroundColor} />
              ) : (
                <>
                  <Ionicons name="wallet-outline" size={18} color={theme.backgroundColor} />
                  <Text style={styles.submitButtonText}>Pay</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Usage History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage History</Text>

        {usage.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No usage history yet</Text>
          </View>
        ) : (
          usage.map((record) => (
            <View key={record.id} style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageModel}>{record.model}</Text>
                {record.is_free_request && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                )}
              </View>
              <View style={styles.usageDetails}>
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Tokens:</Text>
                  <Text style={styles.usageValue}>
                    {record.total_tokens.toLocaleString()} ({record.input_tokens} in / {record.output_tokens} out)
                  </Text>
                </View>
                {!record.is_free_request && (
                  <View style={styles.usageRow}>
                    <Text style={styles.usageLabel}>Cost:</Text>
                    <Text style={styles.usageCost}>{formatCost(record.total_cost)}</Text>
                  </View>
                )}
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Endpoint:</Text>
                  <Text style={styles.usageValue}>{record.endpoint}</Text>
                </View>
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Time:</Text>
                  <Text style={styles.usageValue}>{formatDate(record.created_at)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    loadingContainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'transparent',
    },
    errorContainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'transparent', padding: 20,
    },
    errorText: { color: '#ff4444', fontSize: 16, marginBottom: 20, textAlign: 'center' },
    retryButton: {
      backgroundColor: theme.tintColor, paddingHorizontal: 24,
      paddingVertical: 12, borderRadius: 8,
    },
    retryButtonText: { color: theme.backgroundColor, fontSize: 16, fontWeight: '600' },
    statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: {
      flex: 1, backgroundColor: theme.secondaryBackgroundColor,
      padding: 16, borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    statLabel: {
      color: theme.secondaryTextColor, fontSize: 12,
      marginBottom: 8, fontFamily: 'Geist-Regular',
    },
    statValue: {
      color: theme.tintColor, fontSize: 20,
      fontWeight: '700', fontFamily: 'Geist-Bold',
    },
    section: { paddingHorizontal: 16, paddingBottom: 16 },
    sectionTitle: {
      color: theme.textColor, fontSize: 18, fontWeight: '700',
      marginBottom: 16, fontFamily: 'Geist-Bold',
    },

    // Deposit
    depositToggleButton: {
      backgroundColor: theme.tintColor, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 12,
    },
    depositToggleText: {
      color: theme.backgroundColor, fontSize: 16,
      fontWeight: '700', fontFamily: 'Geist-Bold',
    },
    depositCard: {
      backgroundColor: theme.secondaryBackgroundColor, borderRadius: 16,
      padding: 20, marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    depositTitle: {
      color: theme.textColor, fontSize: 18, fontWeight: '700',
      fontFamily: 'Geist-Bold', marginBottom: 4,
    },
    depositSubtitle: {
      color: theme.secondaryTextColor, fontSize: 13,
      fontFamily: 'Geist-Regular', marginBottom: 16,
    },
    inputLabel: {
      color: theme.textColor, fontSize: 14, fontWeight: '600',
      fontFamily: 'Geist-SemiBold', marginBottom: 6,
    },
    amountInput: {
      backgroundColor: theme.backgroundColor, borderWidth: 1,
      borderColor: theme.borderColor, borderRadius: 10,
      padding: 12, color: theme.textColor, fontSize: 16,
      fontFamily: 'Geist-Regular', marginBottom: 20,
    },
    submitButton: {
      backgroundColor: theme.tintColor, paddingVertical: 14,
      borderRadius: 12, alignItems: 'center',
      flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: {
      color: theme.backgroundColor, fontSize: 16,
      fontWeight: '700', fontFamily: 'Geist-Bold',
    },

    // Usage history
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: {
      color: theme.secondaryTextColor, fontSize: 16, fontFamily: 'Geist-Regular',
    },
    usageCard: {
      backgroundColor: theme.secondaryBackgroundColor, borderRadius: 12,
      padding: 16, marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    usageHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 12,
    },
    usageModel: {
      color: theme.textColor, fontSize: 16, fontWeight: '600',
      fontFamily: 'Geist-SemiBold',
    },
    freeBadge: {
      backgroundColor: theme.tintColor + '20',
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    },
    freeBadgeText: {
      color: theme.tintColor, fontSize: 10,
      fontWeight: '700', fontFamily: 'Geist-Bold',
    },
    usageDetails: { gap: 8 },
    usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usageLabel: {
      color: theme.secondaryTextColor, fontSize: 13, fontFamily: 'Geist-Regular',
    },
    usageValue: {
      color: theme.textColor, fontSize: 13, fontFamily: 'Geist-Regular',
      flex: 1, textAlign: 'right',
    },
    usageCost: {
      color: theme.tintColor, fontSize: 13,
      fontWeight: '600', fontFamily: 'Geist-SemiBold',
    },
  })
