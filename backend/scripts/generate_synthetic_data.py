import os
import sys
import numpy as np
import pandas as pd
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Base, District, Station, CrimeEvent, Suspect, SuspectLink
from app.db import engine, SessionLocal

fake = Faker("en_IN")
CRIME_TYPES = ["theft", "burglary", "chain_snatching", "assault", "vehicle_theft", "cybercrime", "public_nuisance"]

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

def generate_data(num_events=75000):
    db = SessionLocal()
    
    # 1. Generate Districts
    print("Generating districts...")
    district_names = [
        "Bengaluru Urban", "Mysuru", "Mangaluru", "Hubballi-Dharwad", "Belagavi",
        "Kalaburagi", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru",
        "Raichur", "Bidar", "Hosapete", "Gadag-Betageri", "Robertsonpet",
        "Hassan", "Bhadravati", "Chitradurga", "Kolar", "Mandya",
        "Chikkamagaluru", "Udupi", "Davanagere", "Bagalkot", "Karwar",
        "Chamarajanagar", "Ramanagara", "Yadgir", "Koppal", "Haveri"
    ]
    
    districts = []
    for i, name in enumerate(district_names):
        # Rough coordinates for Karnataka
        lat = 15.0 + np.random.uniform(-3, 3)
        lon = 76.0 + np.random.uniform(-2, 2)
        # Create a simple square polygon for the district geometry
        geom_wkt = f"MULTIPOLYGON((( {lon-0.1} {lat-0.1}, {lon+0.1} {lat-0.1}, {lon+0.1} {lat+0.1}, {lon-0.1} {lat+0.1}, {lon-0.1} {lat-0.1} )))"
        
        district = District(
            name=name,
            population=np.random.randint(500000, 5000000),
            geom=geom_wkt
        )
        db.add(district)
        districts.append({'id': i+1, 'name': name, 'lat': lat, 'lon': lon, 'density_weight': np.random.uniform(0.1, 1.0)})
    
    db.commit()
    
    # Increase weight for major cities
    districts[0]['density_weight'] = 5.0  # Bengaluru
    districts[1]['density_weight'] = 2.0  # Mysuru
    districts[2]['density_weight'] = 2.0  # Mangaluru

    districts_df = pd.DataFrame(districts)
    districts_df['crime_type_profile'] = [[0.3, 0.15, 0.1, 0.2, 0.1, 0.1, 0.05]] * len(districts) # Simple static profile for now

    # 2. Generate Stations
    print("Generating stations...")
    stations = []
    for index, d in districts_df.iterrows():
        num_stations = int(d['density_weight'] * 10) + 2
        for _ in range(num_stations):
            lat = d['lat'] + np.random.normal(0, 0.05)
            lon = d['lon'] + np.random.normal(0, 0.05)
            station = Station(
                name=f"{d['name']} {fake.street_name()} Police Station",
                district_id=d['id'],
                lat=lat,
                lon=lon
            )
            db.add(station)
            stations.append({'id': len(stations) + 1, 'district_id': d['id'], 'lat': lat, 'lon': lon})
    db.commit()
    stations_df = pd.DataFrame(stations)

    # 3. Generate Crime Events
    print(f"Generating {num_events} crime events...")
    events = []
    weights = districts_df['density_weight'] / districts_df['density_weight'].sum()
    
    for i in range(num_events):
        if i % 10000 == 0:
            print(f"  ... {i} events generated")
            
        d_idx = np.random.choice(districts_df.index, p=weights)
        d = districts_df.iloc[d_idx]
        
        # Pick a random station in this district
        d_stations = stations_df[stations_df['district_id'] == d['id']]
        if len(d_stations) > 0:
            st = d_stations.sample(1).iloc[0]
            st_id = int(st['id'])
            lat = st['lat'] + np.random.normal(0, 0.01)
            lon = st['lon'] + np.random.normal(0, 0.01)
        else:
            st_id = None
            lat = d['lat'] + np.random.normal(0, 0.05)
            lon = d['lon'] + np.random.normal(0, 0.05)
            
        crime = np.random.choice(CRIME_TYPES, p=d['crime_type_profile'])
        occurred_at = fake.date_time_between(start_date="-1y", end_date="now")
        
        event = CrimeEvent(
            station_id=st_id,
            district_id=int(d['id']),
            crime_type=crime,
            occurred_at=occurred_at,
            lat=lat,
            lon=lon,
            status=np.random.choice(["reported", "under_investigation", "closed"], p=[0.5, 0.3, 0.2]),
            severity=int(np.random.choice([1, 2, 3, 4, 5], p=[0.3, 0.3, 0.2, 0.15, 0.05]))
        )
        db.add(event)
        events.append(event)
        
        # Batch insert to avoid memory issues
        if len(events) >= 5000:
            db.commit()
            events = []
            
    db.commit()

    # 4. Generate Suspects & Links (for network analysis)
    print("Generating suspects and links...")
    # Fetch some event IDs to use for linking
    all_events = db.query(CrimeEvent.event_id).limit(5000).all()
    event_ids = [e[0] for e in all_events]
    
    # 20 groups of suspects
    suspect_groups = 20
    for g in range(suspect_groups):
        # Each group has 3-8 members
        group_size = np.random.randint(3, 9)
        d_idx = np.random.choice(districts_df.index)
        d = districts_df.iloc[d_idx]
        
        group_suspects = []
        for _ in range(group_size):
            suspect = Suspect(alias=fake.user_name(), district_id=int(d['id']))
            db.add(suspect)
            db.flush() # flush to get IDs
            group_suspects.append(suspect.suspect_id)
            
        # Create links among them
        shared_cases = np.random.choice(event_ids, size=np.random.randint(2, 5), replace=False)
        for i in range(len(group_suspects)):
            for j in range(i + 1, len(group_suspects)):
                # Link probability within group
                if np.random.random() > 0.3:
                    link = SuspectLink(
                        suspect_a=group_suspects[i],
                        suspect_b=group_suspects[j],
                        shared_event_id=int(np.random.choice(shared_cases)),
                        link_type=np.random.choice(["co-accused", "same_case"])
                    )
                    db.add(link)
                    
    db.commit()
    print("Synthetic data generation complete!")

if __name__ == "__main__":
    init_db()
    generate_data(75000)
