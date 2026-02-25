import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { Alert } from "react-native";
import { DOMAIN } from "../../constants";
import { AppContext } from "../context";

interface TapestryProfile {
  id: string;
  namespace: string;
  created_at: number;
  username: string;
  bio?: string | null;
  image?: string | null;
}

export interface CreateProfileParams {
  username: string;
  bio?: string;
}

export type PostInterface = {
  authorProfile: {
    created_at: number;
    id: string;
    namespace: string;
    username: string;
    bio?: string;
    image?: string;
  };
  content: {
    body?: string;
    created_at: number;
    externalLinkURL: string;
    id: string;
    namespace: string;
    title?: string;
    type?: string;
    image?: string;
    test?: string;
  };
  requestingProfileSocialInfo: {};
  socialCounts: {
    commentCount: number;
    likeCount: number;
  };
};

interface ProfileContextType {
  profile: TapestryProfile | null;
  isLoading: boolean;
  hasProfile: boolean;
  isCreating: boolean;
  createProfile: (params: CreateProfileParams) => void;
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isLoading: false,
  hasProfile: false,
  isCreating: false,
  createProfile: () => {},
  refreshProfile: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { walletAddress } = useContext(AppContext);
  const queryClient = useQueryClient();

  const queryKey = ["tapestry", "profile", walletAddress];

  const { data: profileData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${DOMAIN}/api/tapestry/profiles?walletAddress=${walletAddress}`;
      console.log("📡 Fetching profile:", url);
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Fetch profile error:", res.status, errText);
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      const data = await res.json();
      console.log(
        "✅ Profile response:",
        JSON.stringify(data).substring(0, 200),
      );
      if (data.profiles && data.profiles.length > 0) {
        return data.profiles[0].profile as TapestryProfile;
      }
      return null;
    },
    enabled: !!walletAddress,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async (params: CreateProfileParams) => {
      const url = `${DOMAIN}/api/tapestry/profiles/findOrCreate`;
      console.log("📡 Creating profile:", url, params.username);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          username: params.username,
          bio: params.bio,
          blockchain: "SOLANA",
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Create profile error:", res.status, errText);
        try {
          const errData = JSON.parse(errText);
          throw new Error(errData.error || errText);
        } catch {
          throw new Error(errText);
        }
      }
      const data = await res.json();
      console.log(
        "✅ Profile created:",
        JSON.stringify(data).substring(0, 200),
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data.profile);
    },
    onError: (error: Error) => {
      console.error("❌ Create profile mutation error:", error);
      Alert.alert("Error", error.message);
    },
  });

  const profile = profileData ?? null;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isLoading,
        hasProfile: !!profile,
        isCreating: createMutation.isPending,
        createProfile: (params: CreateProfileParams) =>
          createMutation.mutate(params),
        refreshProfile: () => queryClient.invalidateQueries({ queryKey }),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

export interface CommentDetail {
  comment: {
    id: string;
    created_at: number;
    text: string;
  };
  contentId?: string;
  author?: {
    id: string;
    username: string;
    image?: string | null;
    namespace: string;
    created_at: number;
  };
  socialCounts: { likeCount: number };
}

export interface LikeProfile {
  id: string;
  username: string;
  image?: string | null;
  namespace: string;
  created_at: number;
  isFollowedByRequester?: boolean;
}

export function useContentComments(contentId: string | undefined) {
  return useQuery({
    queryKey: ["tapestry", "comments", contentId],
    queryFn: async () => {
      const params = new URLSearchParams({
        contentId: contentId!,
        pageSize: "5",
      });
      const url = `${DOMAIN}/api/tapestry/comments?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
      const data = await res.json();
      return data as {
        comments: CommentDetail[];
        page: number;
        pageSize: number;
      };
    },
    enabled: !!contentId,
  });
}

export function useContentLikes(contentId: string | undefined) {
  return useQuery({
    queryKey: ["tapestry", "likes", contentId],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "5" });
      const url = `${DOMAIN}/api/tapestry/likes/${encodeURIComponent(contentId!)}?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch likes: ${res.status}`);
      const data = await res.json();
      return data as {
        profiles: LikeProfile[];
        total: number;
      };
    },
    enabled: !!contentId,
  });
}

export function useLikeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      profileId,
    }: {
      contentId: string;
      profileId: string;
    }) => {
      const url = `${DOMAIN}/api/tapestry/likes/${encodeURIComponent(contentId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startId: profileId }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to like: ${res.status} ${errText}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tapestry", "likes", variables.contentId],
      });
      queryClient.invalidateQueries({ queryKey: ["tapestry", "contents"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

export function useCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      profileId,
      text,
    }: {
      contentId: string;
      profileId: string;
      text: string;
    }) => {
      const url = `${DOMAIN}/api/tapestry/comments`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, text, contentId }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to comment: ${res.status} ${errText}`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tapestry", "comments", variables.contentId],
      });
      queryClient.invalidateQueries({ queryKey: ["tapestry", "contents"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });
}

export function useNewsFeed(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["tapestry", "contents", page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        orderByField: "created_at",
        orderByDirection: "DESC",
      });
      const url = `${DOMAIN}/api/tapestry/contents?${params}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch contents: ${res.status} ${errText}`);
      }
      const data = await res.json();
      return data as {
        contents: PostInterface[];
        page: number;
        pageSize: number;
        totalCount: number;
      };
    },
  });
}
