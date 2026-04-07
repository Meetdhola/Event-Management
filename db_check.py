from pymongo import MongoClient

def main():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        dbs = client.list_database_names()
        print("Databases:", dbs)
        
        for db_name in dbs:
            if db_name in ["admin", "config", "local"]:
                continue
            db = client[db_name]
            print(f"\nCollections in '{db_name}':")
            for coll in db.list_collection_names():
                count = db[coll].count_documents({})
                print(f"  - {coll} ({count} documents)")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
