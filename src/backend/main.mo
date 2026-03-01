import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  type Listing = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    imageUrls : [Storage.ExternalBlob];
    status : Status;
  };

  type Drop = {
    id : Text;
    name : Text;
    scheduledAt : Int; // Unix timestamp seconds
    listingIds : [Text];
  };

  type Status = {
    #available;
    #selling;
  };

  type BackupListingEntry = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    status : Status;
  };

  type BackupDropEntry = {
    id : Text;
    name : Text;
    scheduledAt : Int;
    listingIds : [Text];
  };

  type BackupData = {
    listings : [BackupListingEntry];
    drops : [BackupDropEntry];
  };

  func compareDropsByScheduledAt(drop1 : Drop, drop2 : Drop) : Order.Order {
    switch (Int.compare(drop1.scheduledAt, drop2.scheduledAt)) {
      case (#less) { #less };
      case (#equal) { #equal };
      case (#greater) { #greater };
    };
  };

  func contains(array : [Text], value : Text) : Bool {
    for (item in array.values()) {
      if (item == value) {
        return true;
      };
    };
    false;
  };

  let listings = Map.empty<Text, Listing>();
  let drops = Map.empty<Text, Drop>();

  let adminUsername = "slimkid3";
  let adminPassword = "AliceInChains92";

  func verifyAdmin(username : Text, password : Text) {
    if (username != adminUsername or password != adminPassword) {
      Runtime.trap("Invalid admin credentials");
    };
  };

  public query ({ caller }) func getAllListings() : async [Listing] {
    let currentTime = Time.now() / 1_000_000_000;
    let activeDrops = drops.values().toArray().filter(
      func(drop) {
        drop.scheduledAt > currentTime;
      }
    );

    let dropListingIds = activeDrops.foldRight<Drop, [Text]>(
      [],
      func(drop, acc) {
        acc.concat(drop.listingIds);
      },
    );

    listings.values().toArray().filter(
      func(listing) { not contains(dropListingIds, listing.id) }
    );
  };

  public query ({ caller }) func getListing(id : Text) : async ?Listing {
    listings.get(id);
  };

  public shared ({ caller }) func addListing(
    username : Text,
    password : Text,
    id : Text,
    name : Text,
    price : Text,
    description : Text,
    imageUrls : [Storage.ExternalBlob],
    status : Status,
  ) : async () {
    verifyAdmin(username, password);
    let listing : Listing = {
      id;
      name;
      price;
      description;
      imageUrls;
      status;
    };
    listings.add(id, listing);
  };

  public shared ({ caller }) func editListing(
    username : Text,
    password : Text,
    id : Text,
    name : Text,
    price : Text,
    description : Text,
    imageUrls : [Storage.ExternalBlob],
    status : Status,
  ) : async () {
    verifyAdmin(username, password);
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?_) {
        let updatedListing : Listing = {
          id;
          name;
          price;
          description;
          imageUrls;
          status;
        };
        listings.add(id, updatedListing);
      };
    };
  };

  public shared ({ caller }) func deleteListing(username : Text, password : Text, id : Text) : async () {
    verifyAdmin(username, password);
    listings.remove(id);
  };

  public shared ({ caller }) func setListingStatus(username : Text, password : Text, id : Text, status : Status) : async () {
    verifyAdmin(username, password);
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing not found") };
      case (?listing) {
        let updatedListing : Listing = {
          id = listing.id;
          name = listing.name;
          price = listing.price;
          description = listing.description;
          imageUrls = listing.imageUrls;
          status;
        };
        listings.add(id, updatedListing);
      };
    };
  };

  public shared ({ caller }) func createDrop(
    username : Text,
    password : Text,
    id : Text,
    name : Text,
    scheduledAt : Int,
    listingIds : [Text],
  ) : async () {
    verifyAdmin(username, password);
    let drop : Drop = {
      id;
      name;
      scheduledAt;
      listingIds;
    };
    drops.add(id, drop);
  };

  public shared ({ caller }) func editDrop(
    username : Text,
    password : Text,
    id : Text,
    name : Text,
    scheduledAt : Int,
    listingIds : [Text],
  ) : async () {
    verifyAdmin(username, password);
    switch (drops.get(id)) {
      case (null) { Runtime.trap("Drop not found") };
      case (?_) {
        let updatedDrop : Drop = {
          id;
          name;
          scheduledAt;
          listingIds;
        };
        drops.add(id, updatedDrop);
      };
    };
  };

  public shared ({ caller }) func deleteDrop(username : Text, password : Text, id : Text) : async () {
    verifyAdmin(username, password);
    drops.remove(id);
  };

  public shared ({ caller }) func getAllDrops(username : Text, password : Text) : async [Drop] {
    verifyAdmin(username, password);
    drops.values().toArray().sort(compareDropsByScheduledAt);
  };

  public shared ({ caller }) func getDrop(username : Text, password : Text, id : Text) : async ?Drop {
    verifyAdmin(username, password);
    drops.get(id);
  };

  public shared ({ caller }) func exportData(username : Text, password : Text) : async BackupData {
    verifyAdmin(username, password);

    let backupListings = listings.values().toArray().map(
      func(listing) {
        {
          id = listing.id;
          name = listing.name;
          price = listing.price;
          description = listing.description;
          status = listing.status;
        };
      }
    );

    let backupDrops = drops.values().toArray().map(
      func(drop) { drop }
    );

    {
      listings = backupListings;
      drops = backupDrops;
    };
  };

  public shared ({ caller }) func importData(
    username : Text,
    password : Text,
    data : BackupData,
  ) : async () {
    verifyAdmin(username, password);

    for (backupListing in data.listings.values()) {
      switch (listings.get(backupListing.id)) {
        case (null) {
          let newListing : Listing = {
            id = backupListing.id;
            name = backupListing.name;
            price = backupListing.price;
            description = backupListing.description;
            imageUrls = [];
            status = backupListing.status;
          };
          listings.add(backupListing.id, newListing);
        };
        case (?existingListing) {
          let updatedListing : Listing = {
            id = backupListing.id;
            name = backupListing.name;
            price = backupListing.price;
            description = backupListing.description;
            imageUrls = existingListing.imageUrls;
            status = backupListing.status;
          };
          listings.add(backupListing.id, updatedListing);
        };
      };
    };

    for (backupDrop in data.drops.values()) {
      drops.add(backupDrop.id, backupDrop);
    };
  };
};
