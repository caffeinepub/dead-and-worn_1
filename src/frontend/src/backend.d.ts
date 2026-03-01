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
export interface Listing {
    id: string;
    status: Status;
    name: string;
    description: string;
    imageUrl: ExternalBlob;
    price: string;
}
export enum Status {
    available = "available",
    selling = "selling"
}
export interface backendInterface {
    addListing(adminUsername: string, adminPassword: string, id: string, name: string, price: string, description: string, imageUrl: ExternalBlob): Promise<void>;
    deleteListing(adminUsername: string, adminPassword: string, id: string): Promise<void>;
    editListing(adminUsername: string, adminPassword: string, id: string, name: string, price: string, description: string, imageUrl: ExternalBlob, status: Status): Promise<void>;
    getAllListings(): Promise<Array<Listing>>;
    getListing(id: string): Promise<Listing | null>;
    setListingStatus(adminUsername: string, adminPassword: string, id: string, status: Status): Promise<void>;
}
