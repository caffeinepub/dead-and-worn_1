import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  type Listing = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    imageUrl : Storage.ExternalBlob;
    status : Status;
  };

  type Status = {
    #available;
    #selling;
  };

  module Listing {
    public func compare(listing1 : Listing, listing2 : Listing) : Order.Order {
      Text.compare(listing1.id, listing2.id);
    };
  };

  let listings = Map.empty<Text, Listing>();

  let adminUsername = "slimkid3";
  let adminPassword = "AliceInChains92";

  func verifyAdmin(username : Text, password : Text) {
    if (username != adminUsername or password != adminPassword) {
      Runtime.trap("Invalid admin credentials");
    };
  };

  public query ({ caller }) func getAllListings() : async [Listing] {
    listings.values().toArray().sort();
  };

  public query ({ caller }) func getListing(id : Text) : async ?Listing {
    listings.get(id);
  };

  public shared ({ caller }) func addListing(adminUsername : Text, adminPassword : Text, id : Text, name : Text, price : Text, description : Text, imageUrl : Storage.ExternalBlob) : async () {
    verifyAdmin(adminUsername, adminPassword);
    let listing : Listing = {
      id;
      name;
      price;
      description;
      imageUrl;
      status = #available;
    };
    listings.add(id, listing);
  };

  public shared ({ caller }) func editListing(adminUsername : Text, adminPassword : Text, id : Text, name : Text, price : Text, description : Text, imageUrl : Storage.ExternalBlob, status : Status) : async () {
    verifyAdmin(adminUsername, adminPassword);
    switch (listings.get(id)) {
      case (null) { () };
      case (?_) {
        let updatedListing : Listing = {
          id;
          name;
          price;
          description;
          imageUrl;
          status;
        };
        listings.add(id, updatedListing);
      };
    };
  };

  public shared ({ caller }) func deleteListing(adminUsername : Text, adminPassword : Text, id : Text) : async () {
    verifyAdmin(adminUsername, adminPassword);
    listings.remove(id);
  };

  public shared ({ caller }) func setListingStatus(adminUsername : Text, adminPassword : Text, id : Text, status : Status) : async () {
    verifyAdmin(adminUsername, adminPassword);
    switch (listings.get(id)) {
      case (null) { () };
      case (?listing) {
        let updatedListing : Listing = {
          id = listing.id;
          name = listing.name;
          price = listing.price;
          description = listing.description;
          imageUrl = listing.imageUrl;
          status;
        };
        listings.add(id, updatedListing);
      };
    };
  };
};
