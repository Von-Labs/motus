import { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { ThemeContext, AppContext } from '../context'
import { DOMAIN } from '../../constants'

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
  const styles = getStyles(theme)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [usage, setUsage] = useState<UsageRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)

      if (!walletAddress) {
        setError('No wallet connected')
        setLoading(false)
        return
      }

      // Fetch user stats
      const statsResponse = await fetch(`${DOMAIN}/api/user/stats`, {
        headers: {
          'X-Wallet-Address': walletAddress,
        },
      })

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats')
      }

      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch usage history
      const usageResponse = await fetch(`${DOMAIN}/api/user/usage?limit=50`, {
        headers: {
          'X-Wallet-Address': walletAddress,
        },
      })

      if (!usageResponse.ok) {
        throw new Error('Failed to fetch usage')
      }

      const usageData = await usageResponse.json()
      setUsage(usageData.usage || [])
    } catch (err: any) {
      console.error('Error fetching usage data:', err)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCost = (cost: string) => {
    return `$${parseFloat(cost).toFixed(4)}`
  }

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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.tintColor}
        />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Free Requests</Text>
          <Text style={styles.statValue}>
            {stats?.stats?.freeRequestsRemaining || 0}
          </Text>
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
                    <Text style={styles.usageCost}>
                      {formatCost(record.total_cost)}
                    </Text>
                  </View>
                )}

                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Endpoint:</Text>
                  <Text style={styles.usageValue}>{record.endpoint}</Text>
                </View>

                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Time:</Text>
                  <Text style={styles.usageValue}>
                    {formatDate(record.created_at)}
                  </Text>
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
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundColor,
      padding: 20,
    },
    errorText: {
      color: '#ff4444',
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.backgroundColor,
      fontSize: 16,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.secondaryBackgroundColor,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    statLabel: {
      color: theme.secondaryTextColor,
      fontSize: 12,
      marginBottom: 8,
      fontFamily: 'Geist-Regular',
    },
    statValue: {
      color: theme.tintColor,
      fontSize: 20,
      fontWeight: '700',
      fontFamily: 'Geist-Bold',
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      color: theme.textColor,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      fontFamily: 'Geist-Bold',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.secondaryTextColor,
      fontSize: 16,
      fontFamily: 'Geist-Regular',
    },
    usageCard: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      padding: 16,
      marginBottom: 12,
    },
    usageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    usageModel: {
      color: theme.textColor,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Geist-SemiBold',
    },
    freeBadge: {
      backgroundColor: theme.tintColor + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    freeBadgeText: {
      color: theme.tintColor,
      fontSize: 10,
      fontWeight: '700',
      fontFamily: 'Geist-Bold',
    },
    usageDetails: {
      gap: 8,
    },
    usageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    usageLabel: {
      color: theme.secondaryTextColor,
      fontSize: 13,
      fontFamily: 'Geist-Regular',
    },
    usageValue: {
      color: theme.textColor,
      fontSize: 13,
      fontFamily: 'Geist-Regular',
      flex: 1,
      textAlign: 'right',
    },
    usageCost: {
      color: theme.tintColor,
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Geist-SemiBold',
    },
  })
