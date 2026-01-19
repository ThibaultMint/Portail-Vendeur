create table inventory (
  serial_number text primary key,
  product_group text,
  mint_url text,
  shopify_product_id text,
  status text default 'en_attente',
  created_at timestamptz default now(),
  date_ajout_service date,
  date_achat date,
  updated_at timestamptz default now(),
  service_actuel text,
  type_vendeur text,
  nom_vendeur text,
  site_annonce text,
  lien_velo_neuf text,
  marque text not null,
  modele text not null,
  taille text,
  annee_affichee integer,
  type_velo text,
  is_vae boolean default false,
  vae_kilometrage integer,
  etat_visuel text,
  prix_neuf numeric(10,2),
  prix_neuf_destocke numeric(10,2),
  prix_occasion_marche numeric(10,2),
  tva boolean,
  frais_pieces_estimes numeric(10,2),
  offre_velokaz text,
  prix_achat_negocie numeric(10,2),
  prix_negocie_vs_demande_pct numeric(5,2),
  prix_negocie_vs_demande_eur numeric(10,2),
  prix_negocie_vs_optimise_pct numeric(5,2),
  prix_negocie_vs_optimise_eur numeric(10,2),
  prix_negocie_vs_max_pct numeric(5,2),
  prix_negocie_vs_max_eur numeric(10,2),
  commentaires text
);

create index idx_inventory_product_group on inventory(product_group);
create index idx_inventory_mint_url on inventory(mint_url);
create index idx_inventory_status on inventory(status);
create index idx_inventory_marque_modele on inventory(marque, modele);
create index idx_inventory_date_achat on inventory(date_achat);
