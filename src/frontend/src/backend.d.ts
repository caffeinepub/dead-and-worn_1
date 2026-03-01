import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Drop {
    id: string;
    name: string;
    listingIds: Array<string>;
    scheduledAt: bigint;
}
export interface BackupDropEntry {
    id: string;
    name: string;
    listingIds: Array<string>;
    scheduledAt: bigint;
}
export interface Listing {
    id: string;
    status: Status;
    imageUrls: Array<ExternalBlob>;
    name: string;
    description: string;
    price: string;
}
export interface BackupData {
    listings: Array<BackupListingEntry>;
    drops: Array<BackupDropEntry>;
}
export interface BackupListingEntry {
    id: string;
    status: Status;
    name: string;
    description: string;
    price: string;
}
export enum Status {
    available = "available",
    selling = "selling"
}
export interface backendInterface {
    addListing(username: string, password: string, id: string, name: string, price: string, description: string, imageUrls: Array<ExternalBlob>, status: Status): Promise<void>;
    createDrop(username: string, password: string, id: string, name: string, scheduledAt: bigint, listingIds: Array<string>): Promise<void>;
    deleteDrop(username: string, password: string, id: string): Promise<void>;
    deleteListing(username: string, password: string, id: string): Promise<void>;
    editDrop(username: string, password: string, id: string, name: string, scheduledAt: bigint, listingIds: Array<string>): Promise<void>;
    editListing(username: string, password: string, id: string, name: string, price: string, description: string, imageUrls: Array<ExternalBlob>, status: Status): Promise<void>;
    exportData(username: string, password: string): Promise<BackupData>;
    getAllDrops(username: string, password: string): Promise<Array<Drop>>;
    getAllListings(): Promise<Array<Listing>>;
    getDrop(username: string, password: string, id: string): Promise<Drop | null>;
    getListing(id: string): Promise<Listing | null>;
    importData(username: string, password: string, data: BackupData): Promise<void>;
    setListingStatus(username: string, password: string, id: string, status: Status): Promise<void>;
}
