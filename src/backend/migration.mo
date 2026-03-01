import Map "mo:core/Map";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";

module {
  type OldListing = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    imageUrls : [Storage.ExternalBlob];
    status : Status;
  };

  type OldDrop = {
    id : Text;
    name : Text;
    scheduledAt : Int;
    listingIds : [Text];
  };

  type Status = {
    #available;
    #selling;
  };

  type OldActor = {
    listings : Map.Map<Text, OldListing>;
    drops : Map.Map<Text, OldDrop>;
  };

  type NewListing = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    imageUrls : [Storage.ExternalBlob];
    status : Status;
  };

  type NewDrop = {
    id : Text;
    name : Text;
    scheduledAt : Int;
    listingIds : [Text];
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

  type NewActor = {
    listings : Map.Map<Text, NewListing>;
    drops : Map.Map<Text, NewDrop>;
  };

  public func run(old : OldActor) : NewActor {
    {
      listings = old.listings;
      drops = old.drops;
    };
  };
};
