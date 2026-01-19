#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'import de l'export achat vers la table inventory Supabase
Nettoie et transforme les données avant l'upsert
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Charger les variables d'environnement
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ Variables SUPABASE_URL et SUPABASE_KEY manquantes dans .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapping des colonnes Excel → Supabase
COLUMN_MAPPING = {
    "Numéro de série": "serial_number",
    "Date ajout au service": "date_ajout_service",
    "Date d'achat": "date_achat",
    "Service Actuel": "service_actuel",
    "Type Vendeur": "type_vendeur",
    "Nom vendeur": "nom_vendeur",
    "Site annonce": "site_annonce",
    "Lien vélo neuf": "lien_velo_neuf",
    "Marque": "marque",
    "Modèle": "modele",
    "Taille": "taille",
    "Année affichée": "annee_affichee",
    "Catégorie": "type_velo",  # Renommé depuis "Type Vélo"
    "Type de vélo": "is_vae",  # Transformé depuis VAE (Oui/Non)
    "Kilométrage": "vae_kilometrage",  # Renommé depuis "SSI vae Nombre de kms"
    "État": "etat_visuel",
    "Prix neuf": "prix_neuf",
    "Prix neuf déstocké": "prix_neuf_destocke",
    "Prix occasion marché": "prix_occasion_marche",
    "TVA": "tva",
    "Frais pièces estimés": "frais_pieces_estimes",
    "Offre Velokaz": "offre_velokaz",
    "Prix achat négocié": "prix_achat_negocie",
    "Prix négocié Vs Prix demandé %": "prix_negocie_vs_demande_pct",
    "Prix négocié Vs Prix demandé €": "prix_negocie_vs_demande_eur",
    "Prix négocié Vs Prix optimisé %": "prix_negocie_vs_optimise_pct",
    "Prix négocié Vs Prix optimisé €": "prix_negocie_vs_optimise_eur",
    "Prix négocié Vs Prix Max %": "prix_negocie_vs_max_pct",
    "Prix négocié Vs Prix Max €": "prix_negocie_vs_max_eur",
    "Commentaires": "commentaires"
}

def clean_serial_number(serial):
    """Retire le # devant les numéros de série"""
    if pd.isna(serial):
        return None
    serial_str = str(serial).strip()
    if serial_str.startswith("#"):
        return serial_str[1:].strip()
    return serial_str

def transform_vae_to_type(vae_value):
    """Transforme VAE (Oui/Non) en Type de vélo (Électrique/Musculaire)"""
    if pd.isna(vae_value):
        return "Musculaire"
    vae_str = str(vae_value).strip().lower()
    if vae_str in ["oui", "yes", "1", "true"]:
        return "Électrique"
    return "Musculaire"

def transform_categorie(type_velo):
    """Transforme Type Vélo en Catégorie avec nouvelles valeurs"""
    if pd.isna(type_velo):
        return None
    
    type_str = str(type_velo).strip().upper()
    
    mapping = {
        "ROUTE": "Vélo De Route",
        "URBAIN": "Vélo de ville",
        "VTT": "VTT",
        "GRAVEL": "Gravel",
        "CARGO": "Cargo",
        # Ajoutez d'autres mappings si nécessaire
    }
    
    return mapping.get(type_str, type_velo)

def parse_date(date_value):
    """Parse les dates Excel en format ISO"""
    if pd.isna(date_value):
        return None
    
    if isinstance(date_value, str):
        # Essayer différents formats
        for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"]:
            try:
                return datetime.strptime(date_value, fmt).date().isoformat()
            except:
                continue
    
    # Si c'est déjà un objet datetime pandas
    try:
        return pd.to_datetime(date_value).date().isoformat()
    except:
        return None

def transform_tva(tva_value):
    """Transforme TVA en booléen"""
    if pd.isna(tva_value):
        return False
    tva_str = str(tva_value).strip().lower()
    return tva_str in ["oui", "yes", "1", "true"]

def clean_numeric(value):
    """Nettoie les valeurs numériques"""
    if pd.isna(value):
        return None
    try:
        # Remplacer virgules par points et supprimer espaces
        clean_val = str(value).replace(",", ".").replace(" ", "").strip()
        if clean_val == "" or clean_val == "-":
            return None
        return float(clean_val)
    except:
        return None

def load_and_clean_export(file_path):
    """Charge et nettoie le fichier export"""
    print(f"📂 Chargement de {file_path}...")
    
    # Lire l'Excel
    df = pd.read_excel(file_path)
    
    print(f"   📊 {len(df)} lignes chargées")
    
    # 1. Supprimer les lignes vides
    df = df.dropna(how='all')
    print(f"   ✅ {len(df)} lignes après suppression des lignes vides")
    
    # 2. Filtrer par Service Actuel (garder tout sauf "Supprimé" et "Achat")
    if "Service Actuel" in df.columns:
        df = df[~df["Service Actuel"].isin(["Supprimé", "Achat"])]
        print(f"   ✅ {len(df)} lignes après filtrage Service Actuel")
    
    # 3. Renommer "Type Vélo" en "Catégorie" avant transformation
    if "Type Vélo" in df.columns:
        df = df.rename(columns={"Type Vélo": "Catégorie"})
    
    # 4. Renommer "SSI vae\nNombre de kms" en "Kilométrage"
    for col in df.columns:
        if "vae" in col.lower() and "kms" in col.lower():
            df = df.rename(columns={col: "Kilométrage"})
            break
    
    # 5. Nettoyer les numéros de série (retirer #)
    if "Numéro de série" in df.columns:
        df["Numéro de série"] = df["Numéro de série"].apply(clean_serial_number)
        # Supprimer les lignes sans numéro de série
        df = df.dropna(subset=["Numéro de série"])
        print(f"   ✅ {len(df)} lignes avec numéros de série valides")
    
    # 6. Transformer VAE en "Type de vélo" (Électrique/Musculaire)
    if "VAE" in df.columns:
        df["Type de vélo"] = df["VAE"].apply(transform_vae_to_type)
        df = df.drop(columns=["VAE"])
    
    # 7. Transformer Catégorie (ROUTE → Vélo De Route, etc.)
    if "Catégorie" in df.columns:
        df["Catégorie"] = df["Catégorie"].apply(transform_categorie)
    
    return df

def prepare_for_supabase(df):
    """Prépare les données pour l'upsert Supabase"""
    print("🔄 Transformation des données...")
    
    records = []
    
    for idx, row in df.iterrows():
        record = {}
        
        for excel_col, db_col in COLUMN_MAPPING.items():
            if excel_col not in df.columns:
                continue
            
            value = row[excel_col]
            
            # Dates
            if db_col in ["date_ajout_service", "date_achat"]:
                record[db_col] = parse_date(value)
            
            # Booléens
            elif db_col == "tva":
                record[db_col] = transform_tva(value)
            
            # is_vae spécial : doit être True/False selon Type de vélo
            elif db_col == "is_vae":
                record[db_col] = (value == "Électrique")
            
            # Numériques
            elif db_col in [
                "annee_affichee", "vae_kilometrage",
                "prix_neuf", "prix_neuf_destocke", "prix_occasion_marche",
                "frais_pieces_estimes", "prix_achat_negocie",
                "prix_negocie_vs_demande_pct", "prix_negocie_vs_demande_eur",
                "prix_negocie_vs_optimise_pct", "prix_negocie_vs_optimise_eur",
                "prix_negocie_vs_max_pct", "prix_negocie_vs_max_eur"
            ]:
                record[db_col] = clean_numeric(value)
            
            # Texte
            else:
                if pd.notna(value):
                    record[db_col] = str(value).strip()
                else:
                    record[db_col] = None
        
        # Valeurs par défaut
        record["status"] = "en_attente"
        
        records.append(record)
    
    print(f"   ✅ {len(records)} enregistrements préparés")
    return records

def upsert_to_supabase(records, batch_size=100):
    """Upsert les données vers Supabase par lots"""
    print(f"📤 Upload vers Supabase (par lots de {batch_size})...")
    
    total = len(records)
    success_count = 0
    error_count = 0
    
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size
        
        try:
            response = supabase.table("inventory").upsert(batch).execute()
            success_count += len(batch)
            print(f"   ✅ Lot {batch_num}/{total_batches} ({len(batch)} lignes)")
        except Exception as e:
            error_count += len(batch)
            print(f"   ❌ Erreur lot {batch_num}/{total_batches}: {e}")
    
    print(f"\n✅ Import terminé:")
    print(f"   • {success_count} lignes importées avec succès")
    if error_count > 0:
        print(f"   • {error_count} lignes en erreur")

def main():
    # Chemin du fichier export
    export_file = input("📁 Chemin du fichier export Excel: ").strip('"')
    
    if not os.path.exists(export_file):
        print(f"❌ Fichier introuvable: {export_file}")
        return
    
    # Charger et nettoyer
    df = load_and_clean_export(export_file)
    
    # Préparer pour Supabase
    records = prepare_for_supabase(df)
    
    # Confirmation
    print(f"\n⚠️  Prêt à uploader {len(records)} lignes vers Supabase")
    confirm = input("Continuer? (oui/non): ").strip().lower()
    
    if confirm in ["oui", "yes", "o", "y"]:
        upsert_to_supabase(records)
    else:
        print("❌ Import annulé")

if __name__ == "__main__":
    main()
