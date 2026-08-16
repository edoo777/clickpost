import { ProductTextEditor } from "@/components/admin/ProductTextEditor";
import { listProductTexts } from "@/lib/admin/product-texts";

export default async function AdminTextsPage() {
  const texts = await listProductTexts();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Textes produit</h1>
        <p className="text-sm text-muted-foreground">
          Un ensemble curé de textes réellement affichés dans l&apos;application — pas une
          administration exhaustive de chaque chaîne de ClickPost.
        </p>
      </header>

      {texts.map((text) => (
        <ProductTextEditor key={text.key} text={text} />
      ))}
    </div>
  );
}
