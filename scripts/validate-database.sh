#!/bin/bash

cd /home/lexdoc-dev/backend

echo "🔍 Validation de la base de données..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const tenants = await prisma.tenant.count();
    const users = await prisma.user.count();
    const clients = await prisma.client.count();
    const folders = await prisma.folder.count();
    const documents = await prisma.document.count();
    const signatures = await prisma.signature.count();
    
    console.log('✅ Connexion réussie');
    console.log('   Cabinets: ' + tenants);
    console.log('   Users: ' + users);
    console.log('   Clients: ' + clients);
    console.log('   Dossiers: ' + folders);
    console.log('   Documents: ' + documents);
    console.log('   Signatures: ' + signatures);
    
    if (tenants >= 2 && users >= 3 && documents >= 5) {
      console.log('');
      console.log('✅ Base de données validée !');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ Données manquantes');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
})();
"
