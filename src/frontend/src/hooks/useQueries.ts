import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, type Listing, Status } from "../backend";
import { useActor } from "./useActor";

export { Status };
export type { Listing };

// ============================================================
// Queries
// ============================================================

export function useGetAllListings() {
  const { actor, isFetching } = useActor();
  return useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllListings();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetListing(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Listing | null>({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getListing(id);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

// ============================================================
// Admin credentials helpers
// ============================================================

export const ADMIN_USERNAME = "slimkid3";
export const ADMIN_PASSWORD = "AliceInChains92";
const ADMIN_SESSION_KEY = "daw_admin_session";

export function getAdminSession(): boolean {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAdminSession(value: boolean) {
  try {
    if (value) {
      localStorage.setItem(ADMIN_SESSION_KEY, "true");
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

// ============================================================
// Mutations — with silent retry
// ============================================================

async function withSilentRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    // Retry once
    return await fn();
  }
}

export function useAddListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      price: string;
      description: string;
      imageBytes: Uint8Array;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor");
      const id = crypto.randomUUID();
      let blob = ExternalBlob.fromBytes(
        params.imageBytes as Uint8Array<ArrayBuffer>,
      );
      if (params.onProgress) {
        blob = blob.withUploadProgress(params.onProgress);
      }
      await withSilentRetry(() =>
        actor.addListing(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          id,
          params.name,
          params.price,
          params.description,
          blob,
        ),
      );
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useEditListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      price: string;
      description: string;
      imageBytes?: Uint8Array | null;
      existingImageUrl?: ExternalBlob;
      status: Status;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor");
      let imageBlob: ExternalBlob;
      if (params.imageBytes && params.imageBytes.length > 0) {
        imageBlob = ExternalBlob.fromBytes(
          params.imageBytes as Uint8Array<ArrayBuffer>,
        );
        if (params.onProgress) {
          imageBlob = imageBlob.withUploadProgress(params.onProgress);
        }
      } else if (params.existingImageUrl) {
        imageBlob = params.existingImageUrl;
      } else {
        throw new Error("No image provided");
      }
      await withSilentRetry(() =>
        actor.editListing(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          params.id,
          params.name,
          params.price,
          params.description,
          imageBlob,
          params.status,
        ),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", variables.id] });
    },
  });
}

export function useDeleteListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await withSilentRetry(() =>
        actor.deleteListing(ADMIN_USERNAME, ADMIN_PASSWORD, id),
      );
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.removeQueries({ queryKey: ["listing", id] });
    },
  });
}

export function useSetListingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; status: Status }) => {
      if (!actor) throw new Error("No actor");
      await withSilentRetry(() =>
        actor.setListingStatus(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          params.id,
          params.status,
        ),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", variables.id] });
    },
  });
}
