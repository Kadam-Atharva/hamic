export const unstable_instant = { 
  prefetch: 'static',
  samples: [
    { params: { id: 'aaaa1111-2222-3333-4444-555555555555' } }
  ]
};

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { connectDB, dbModel } from '@/lib/db';
import ProductDetailView from '@/components/ProductDetailView';
import { Loader2 } from 'lucide-react';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: RouteParams) {
  return (
    <div className="flex-1 bg-zinc-950 flex flex-col">
      <Suspense fallback={
        <div className="flex flex-1 items-center justify-center min-h-[400px] text-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
            <p className="text-xs text-zinc-550">Resolving product files...</p>
          </div>
        </div>
      }>
        {params.then(({ id }) => (
          <ProductDetailsLoader id={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function ProductDetailsLoader({ id }: { id: string }) {
  await connectDB();
  
  const product = await dbModel.Product.findById(id);
  if (!product) {
    notFound();
  }

  const materials = await dbModel.SupportMaterial.find({ productId: id });

  // Serialize Mongoose documents to plain objects to resolve Next.js props serialization errors
  const serializedProduct = JSON.parse(JSON.stringify(product));
  const serializedMaterials = JSON.parse(JSON.stringify(materials));

  return <ProductDetailView product={serializedProduct} materials={serializedMaterials} />;
}
