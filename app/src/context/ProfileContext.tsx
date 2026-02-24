import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
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
      console.log("✅ Profile response:", JSON.stringify(data).substring(0, 200));
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
      console.log("✅ Profile created:", JSON.stringify(data).substring(0, 200));
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
        createProfile: (params: CreateProfileParams) => createMutation.mutate(params),
        refreshProfile: () =>
          queryClient.invalidateQueries({ queryKey }),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
