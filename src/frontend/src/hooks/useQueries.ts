import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Drop, ExternalBlob, type Listing, Status } from "../backend";
import { useActor } from "./useActor";

export { Status };
export type { Drop, Listing };

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

export function useGetAllDrops() {
  const { actor, isFetching } = useActor();
  return useQuery<Drop[]>({
    queryKey: ["drops"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllDrops(ADMIN_USERNAME, ADMIN_PASSWORD);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
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
      imageFiles: Array<{
        bytes: Uint8Array;
        onProgress?: (pct: number) => void;
      }>;
      status?: Status;
    }) => {
      if (!actor) throw new Error("No actor");
      const id = crypto.randomUUID();

      // Build ExternalBlob array — upload all images
      const imageBlobs: ExternalBlob[] = params.imageFiles.map((f) => {
        let blob = ExternalBlob.fromBytes(f.bytes as Uint8Array<ArrayBuffer>);
        if (f.onProgress) {
          blob = blob.withUploadProgress(f.onProgress);
        }
        return blob;
      });

      await withSilentRetry(() =>
        actor.addListing(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          id,
          params.name,
          params.price,
          params.description,
          imageBlobs,
          params.status ?? Status.available,
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
      /**
       * Final merged array of ExternalBlobs.
       * Caller is responsible for building this: keep existing blobs,
       * create new ones via ExternalBlob.fromBytes for newly uploaded files.
       */
      imageUrls: ExternalBlob[];
      status: Status;
    }) => {
      if (!actor) throw new Error("No actor");
      if (params.imageUrls.length === 0)
        throw new Error("At least one image required");

      await withSilentRetry(() =>
        actor.editListing(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          params.id,
          params.name,
          params.price,
          params.description,
          params.imageUrls,
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

export function useCreateDrop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      scheduledAt: bigint;
      listingIds: string[];
    }) => {
      if (!actor) throw new Error("No actor");
      const id = crypto.randomUUID();
      await withSilentRetry(() =>
        actor.createDrop(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          id,
          params.name,
          params.scheduledAt,
          params.listingIds,
        ),
      );
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}

export function useEditDrop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      scheduledAt: bigint;
      listingIds: string[];
    }) => {
      if (!actor) throw new Error("No actor");
      await withSilentRetry(() =>
        actor.editDrop(
          ADMIN_USERNAME,
          ADMIN_PASSWORD,
          params.id,
          params.name,
          params.scheduledAt,
          params.listingIds,
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}

export function useDeleteDrop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await withSilentRetry(() =>
        actor.deleteDrop(ADMIN_USERNAME, ADMIN_PASSWORD, id),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
    },
  });
}
