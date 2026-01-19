#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open(r'c:\Users\thiba\velo-mailer\src\App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer ligne par ligne
replacements = [
    (
        "const multPrice = parkingSelection.priceBand ? getPct(parkingRules.pricePct, parkingSelection.priceBand) : 1;\n\n",
        ""
    ),
    (
        "// ⚠️ Taille : ton selection est une taille (ex \"M\"). On applique son pct si sélectionnée.\n",
        ""
    ),
    (
        "// Total \"base\" pour chaque table (objectif global * produit des filtres avant)\n",
        ""
    ),
    (
        "const objTotalForCategory = objectiveTotal;\n",
        ""
    ),
    (
        "const objTotalForPrice = objectiveTotal * multCategory;\n",
        ""
    ),
    (
        "const objTotalForSize = objectiveTotal * multCategory * multPrice;\n",
        ""
    ),
    (
        "const objTotalForCatMar = objectiveTotal * multCategory * multPrice * multSize;\n",
        "const objTotalForCatMar = objectiveTotal * multCategory * multSize;\n"
    ),
    (
        "// ✅ cascade dans l'ordre : Catégorie -> Prix -> Taille -> CAT_MAR\n",
        ""
    )
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"✅ Remplacé: {old[:50]}...")
    else:
        print(f"❌ Non trouvé: {old[:50]}...")

with open(r'c:\Users\thiba\velo-mailer\src\App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nFichier sauvegardé")
