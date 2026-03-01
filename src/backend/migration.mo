import Map "mo:core/Map";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";

module {
  type OldListing = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    imageUrl : Storage.ExternalBlob;
    status : { #available; #selling };
  };

  type NewListing = {
    id : Text;
    name : Text;
    price : Text;
    description : Text;
    imageUrls : [Storage.ExternalBlob];
    status : { #available; #selling };
  };

  type OldActor = {
    listings : Map.Map<Text, OldListing>;
  };

  type NewActor = {
    listings : Map.Map<Text, NewListing>;
  };

  public func run(old : OldActor) : NewActor {
    let newListings = old.listings.map<Text, OldListing, NewListing>(
      func(_id, oldListing) {
        {
          oldListing with
          imageUrls = [oldListing.imageUrl];
        };
      }
    );
    { old with listings = newListings };
  };
};
