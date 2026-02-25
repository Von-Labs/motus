import Ionicons from "@expo/vector-icons/Ionicons";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { ContentCard } from "../components/newsFeed/ContentCard";
import { getNewsFeedStyles } from "../components/newsFeed/newsFeedStyles";
import { ThemeContext } from "../context";
import { useNewsFeed } from "../context/ProfileContext";

export function NewsFeed() {
  const route = useRoute<any>();
  const { theme } = useContext(ThemeContext);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useNewsFeed(page);
  const styles = getNewsFeedStyles(theme);
  const listRef = useRef<FlatList>(null);
  const lastRefreshTokenRef = useRef<number | string | null>(null);

  const contents = data?.contents ?? [];
  const refreshToken = route?.params?.refreshFeedToken;
  const shouldScrollToTop = route?.params?.scrollToTop;

  useEffect(() => {
    if (!refreshToken || refreshToken === lastRefreshTokenRef.current) return;
    lastRefreshTokenRef.current = refreshToken;
    setPage(1);
    refetch();
    if (shouldScrollToTop) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
  }, [refreshToken, refetch, shouldScrollToTop]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.tintColor} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.mutedForegroundColor}
        />
        <Text style={styles.errorText}>
          {(error as Error)?.message || "Failed to load feed"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={contents}
      keyExtractor={(item, idx) => item.content?.id ?? String(idx)}
      renderItem={({ item }) => (
        <ContentCard item={item} theme={theme} styles={styles} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={() => {
            setPage(1);
            refetch();
          }}
          tintColor={theme.tintColor}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="newspaper-outline"
            size={48}
            color={theme.mutedForegroundColor}
          />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>
            Content from the community will appear here
          </Text>
        </View>
      }
      onEndReached={() => {
        if (data && contents.length < data.totalCount) {
          setPage((p) => p + 1);
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
}
