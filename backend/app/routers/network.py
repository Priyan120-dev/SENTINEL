from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
import networkx as nx
import community as community_louvain

from .. import models
from ..db import get_db

router = APIRouter(prefix="/api/network", tags=["network"])

@router.get("/")
def get_network(
    district_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.SuspectLink, models.Suspect.alias.label("alias_a"))\
        .join(models.Suspect, models.SuspectLink.suspect_a == models.Suspect.suspect_id)
        
    if district_id:
        query = query.filter(models.Suspect.district_id == district_id)
        
    links = query.limit(2000).all()
    if not links:
        return {"nodes": [], "links": []}
        
    # We also need the aliases for suspect_b
    suspect_b_ids = [l[0].suspect_b for l in links]
    suspect_b_aliases = {
        s.suspect_id: s.alias 
        for s in db.query(models.Suspect).filter(models.Suspect.suspect_id.in_(suspect_b_ids)).all()
    }
    
    G = nx.Graph()
    for l, alias_a in links:
        link = l
        alias_b = suspect_b_aliases.get(link.suspect_b, f"Unknown-{link.suspect_b}")
        
        G.add_node(link.suspect_a, name=alias_a)
        G.add_node(link.suspect_b, name=alias_b)
        G.add_edge(link.suspect_a, link.suspect_b, event=link.shared_event_id, type=link.link_type)
        
    # Community detection
    try:
        partition = community_louvain.best_partition(G)
        nx.set_node_attributes(G, partition, "community")
    except Exception:
        pass # If louvain fails, no community
        
    nodes = []
    for node, data in G.nodes(data=True):
        nodes.append({
            "id": node,
            "name": data.get("name"),
            "community": data.get("community", 0)
        })
        
    graph_links = []
    for u, v, data in G.edges(data=True):
        graph_links.append({
            "source": u,
            "target": v,
            "event": data.get("event"),
            "type": data.get("type")
        })
        
    return {"nodes": nodes, "links": graph_links}
