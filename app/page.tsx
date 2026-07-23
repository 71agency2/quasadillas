"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erreur : Les variables d'environnement Supabase sont manquantes.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ClientPage() {
  const [produits, setProduits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categorieActive, setCategorieActive] = useState("");
  
  const [panier, setPanier] = useState<any[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  
  const [produitOuvert, setProduitOuvert] = useState<any | null>(null);
  
  const [varianteChoisie, setVarianteChoisie] = useState<any | null>(null);
  const [supplementsCoches, setSupplementsCoches] = useState<any[]>([]);

  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [noteClient, setNoteClient] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [commandeValidee, setCommandeValidee] = useState(false);
  const [numeroCommande, setNumeroCommande] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").order("id", { ascending: true }),
        supabase.from("produits").select("*").order("id", { ascending: false })
      ]);

      if (catRes.data) { 
        setCategories(catRes.data); 
        if (catRes.data.length > 0) setCategorieActive(catRes.data[0].nom); 
      }
      if (prodRes.data) {
        setProduits(prodRes.data);
      }
    }
    loadData();
  }, []);

  const ouvrirOptionsProduit = (produit: any) => {
    setProduitOuvert(produit);
    if (produit.variantes && produit.variantes.length > 0) {
      setVarianteChoisie(produit.variantes[0]);
    } else {
      setVarianteChoisie(null);
    }
    setSupplementsCoches([]);
  };

  const toggleSupplement = (supp: any) => {
    if (supplementsCoches.some(s => s.nom === supp.nom)) {
      setSupplementsCoches(supplementsCoches.filter(s => s.nom !== supp.nom));
    } else {
      setSupplementsCoches([...supplementsCoches, supp]);
    }
  };

  const ajouterAuPanierDirect = () => {
    if (!produitOuvert) return;

    const prixVariante = varianteChoisie ? varianteChoisie.prix : 0;
    const prixSupps = supplementsCoches.reduce((total, s) => total + s.prix, 0);
    const prixTotalItem = produitOuvert.prix + prixVariante + prixSupps;

    const newItem = {
      idUnique: crypto.randomUUID(),
      produit_id: produitOuvert.id,
      nom: produitOuvert.titre || produitOuvert.nom,
      prixBase: produitOuvert.prix,
      prixTotal: prixTotalItem,
      variante: varianteChoisie,
      supplements: supplementsCoches
    };

    setPanier([...panier, newItem]);
    setProduitOuvert(null); 
  };

  const retirerDuPanier = (idUnique: string) => {
    const nouveauPanier = panier.filter(item => item.idUnique !== idUnique);
    setPanier(nouveauPanier);
    if (nouveauPanier.length === 0) setPanierOuvert(false);
  };

  const totalPanier = panier.reduce((total, item) => total + item.prixTotal, 0);

  const handleCommander = async (e: FormEvent) => {
    e.preventDefault();
    if (panier.length === 0) return alert("Votre panier est vide !");
    setEnvoiEnCours(true);

    let details = panier.map(item => {
      let desc = `- ${item.nom}`;
      if (item.variante) desc += ` [Type: ${item.variante.nom}]`;
      if (item.supplements && item.supplements.length > 0) {
        desc += ` (Extras: ${item.supplements.map((s:any) => s.nom).join(', ')})`;
      }
      return desc;
    }).join('\n');

    if (noteClient.trim()) {
      details += `\n\n📝 NOTE CLIENT :\n${noteClient.trim()}`;
    }

    const { data, error } = await supabase.from("commandes").insert([{
      nom_client: nomClient, 
      telephone_client: telephone, 
      adresse_livraison: adresse, 
      total: totalPanier, 
      details_commande: details, 
      statut: "en attente"
    }]).select();

    setEnvoiEnCours(false);
    
    if (!error && data && data.length > 0) {
      setNumeroCommande(data[0].id); 
      setCommandeValidee(true); 
      setPanier([]); 
      setNomClient(""); 
      setTelephone(""); 
      setAdresse(""); 
      setNoteClient("");
    } else { 
      alert("Erreur lors de la commande : " + error?.message); 
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-[#2B2B2B] font-sans pb-32">
      <header className="bg-white pt-5 pb-4 px-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Sidou Emballage" className="h-14 w-auto object-contain rounded-full border-2 border-[#C59B27]" />
          <div className="flex flex-col">
            <span className="text-[#C59B27] font-bold text-sm">Élégance & Fêtes</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5 font-semibold">Sidou Emballage - Birkhadem</span>
          </div>
        </div>
        <a href="tel:0556458402" className="flex items-center gap-2 group active:scale-95 transition-all shrink-0">
          <span className="text-[#C59B27] font-bold text-[10px] sm:text-xs uppercase tracking-widest text-right leading-tight">Contact</span>
          <div className="bg-[#FCFBF8] border border-[#C59B27]/30 w-10 h-10 rounded-full flex items-center justify-center group-hover:border-[#C59B27] shadow-sm transition-colors">
            <span className="text-lg">📞</span>
          </div>
        </a>
      </header>

      <nav className="flex overflow-x-auto gap-3 p-4 sticky top-0 z-20 bg-white/90 backdrop-blur-md scrollbar-none border-b border-gray-200 shadow-sm">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setCategorieActive(cat.nom)} className={`shrink-0 px-5 py-2.5 rounded-full font-bold uppercase text-sm tracking-wider transition-all border ${categorieActive === cat.nom ? "bg-[#C59B27] text-white border-[#C59B27] shadow-md shadow-[#C59B27]/20" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
            {cat.nom}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-5xl mx-auto mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {produits.filter(p => p.categorie === categorieActive).map(produit => (
            <div key={produit.id} onClick={() => ouvrirOptionsProduit(produit)} className="bg-white border border-gray-200 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-sm hover:shadow-md">
              {produit.image_url ? <img src={produit.image_url} alt={produit.titre} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square bg-gray-50 flex items-center justify-center text-5xl">🎁</div>}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-[#2B2B2B]">{produit.titre || produit.nom}</h3>
                  <span className="bg-[#C59B27]/10 text-[#C59B27] px-3 py-1 rounded-lg font-black text-lg ml-3 border border-[#C59B27]/20 shrink-0">{produit.prix} DA</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mt-2 font-medium">{produit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {produitOuvert && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md border-t sm:border border-gray-200 rounded-t-4xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative shrink-0">
              {produitOuvert.image_url && <img src={produitOuvert.image_url} alt="Image" className="w-full aspect-square object-cover max-h-64" />}
              <button onClick={() => setProduitOuvert(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur text-gray-900 p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-sm">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-1">{produitOuvert.titre || produitOuvert.nom}</h2>
              <p className="text-[#C59B27] font-black mb-6 text-xl">{produitOuvert.prix} DA</p>
              
              {produitOuvert.variantes && produitOuvert.variantes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#C59B27] mb-4 border-b border-gray-200 pb-2">1. Choisissez le type</h3>
                  <div className="space-y-3">
                    {produitOuvert.variantes.map((v: any, idx: number) => {
                      const estCoche = varianteChoisie?.nom === v.nom;
                      return (
                        <div key={idx} onClick={() => setVarianteChoisie(v)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${estCoche ? "bg-[#FCFBF8] border-[#C59B27]" : "bg-white border-gray-200"}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 ${estCoche ? "bg-[#C59B27] border-[#C59B27]" : "bg-white border-gray-300"}`}>{estCoche && <div className="w-2.5 h-2.5 bg-white rounded-full m-auto mt-1"></div>}</div>
                            <span className="font-bold text-[#2B2B2B]">{v.nom}</span>
                          </div>
                          <span className="text-[#2B2B2B] font-black">{produitOuvert.prix + v.prix} DA</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {produitOuvert.supplements && produitOuvert.supplements.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#C59B27] mb-4 border-b border-gray-200 pb-2">2. Extras</h3>
                  <div className="space-y-3">
                    {produitOuvert.supplements.map((supp: any, idx: number) => {
                      const estCoche = supplementsCoches.some(s => s.nom === supp.nom);
                      return (
                        <div key={idx} onClick={() => toggleSupplement(supp)} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${estCoche ? "bg-[#FCFBF8] border-[#C59B27]" : "bg-white border-gray-200"}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-lg border-2 text-center leading-5 ${estCoche ? "bg-[#C59B27] border-[#C59B27] text-white" : "bg-white border-gray-300 text-transparent"}`}>✓</div>
                            <span className="font-bold text-[#2B2B2B]">{supp.nom}</span>
                          </div>
                          <span className="text-[#C59B27] font-black">+{supp.prix} DA</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 bg-white shrink-0">
              <button onClick={ajouterAuPanierDirect} className="w-full bg-[#C59B27] text-white font-black py-5 rounded-2xl uppercase text-sm shadow-lg flex justify-between px-6 transition-transform active:scale-95">
                <span>Ajouter au panier</span>
                <span className="bg-white text-[#C59B27] px-3 py-1 rounded-lg">{produitOuvert.prix + (varianteChoisie ? varianteChoisie.prix : 0) + supplementsCoches.reduce((t, s) => t + s.prix, 0)} DA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {panier.length > 0 && !panierOuvert && !produitOuvert && (
        <button onClick={() => setPanierOuvert(true)} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-[#C59B27] text-white font-black py-5 px-6 rounded-2xl shadow-xl flex justify-between items-center z-40 uppercase tracking-wider text-sm border-2 border-white transition-transform hover:scale-105 active:scale-95">
          <span className="bg-white text-[#C59B27] w-8 h-8 flex items-center justify-center rounded-full">{panier.length}</span>
          <span>Voir mon panier</span>
          <span>{totalPanier} DA</span>
        </button>
      )}

      {panierOuvert && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md border-t sm:border border-gray-200 rounded-t-4xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl font-bold uppercase tracking-wider text-[#2B2B2B]">🛍️ Mon Panier</h2>
              <button onClick={() => setPanierOuvert(false)} className="text-gray-500 bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-bold">✕</button>
            </div>
            {commandeValidee ? (
              <div className="p-10 text-center overflow-y-auto">
                <span className="text-6xl block mb-6">🎂</span>
                <h3 className="text-2xl font-black text-[#C59B27] mb-6 uppercase">Commande Envoyée !</h3>
                <div className="bg-[#FCFBF8] border border-[#C59B27]/30 rounded-2xl p-6 mb-8 inline-block shadow-inner">
                  <p className="text-[#C59B27] text-xs uppercase tracking-widest mb-2 font-bold">N° de commande</p>
                  <p className="text-5xl font-black text-[#C59B27]">#{numeroCommande}</p>
                </div>
                <button onClick={() => { setCommandeValidee(false); setPanierOuvert(false); setNumeroCommande(null); }} className="bg-[#2B2B2B] text-white font-bold py-4 px-8 rounded-2xl uppercase w-full">Retour à la boutique</button>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4 mb-8">
                  {panier.map((item) => (
                    <div key={item.idUnique} className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex-1">
                        <h4 className="font-bold text-[#2B2B2B] text-lg">{item.nom}</h4>
                        {item.variante && <p className="text-xs text-[#C59B27] mt-1 font-bold">Type : {item.variante.nom}</p>}
                        {item.supplements && item.supplements.length > 0 && <p className="text-xs text-gray-500 mt-1 font-medium">Extras : {item.supplements.map((s:any) => s.nom).join(', ')}</p>}
                        <p className="text-[#C59B27] font-black mt-2">{item.prixTotal} DA</p>
                      </div>
                      <button onClick={() => retirerDuPanier(item.idUnique)} className="text-red-500 bg-red-50 p-3 rounded-xl ml-4 hover:bg-red-100 transition-colors">🗑️</button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-end border-t border-gray-200 pt-6 mb-8">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">Total à payer</span>
                  <span className="text-4xl font-black text-[#C59B27]">{totalPanier} DA</span>
                </div>
                <form onSubmit={handleCommander} className="space-y-4 pb-6">
                  <input type="text" required placeholder="Nom complet" value={nomClient} onChange={(e) => setNomClient(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl p-4 outline-none focus:border-[#C59B27]" />
                  <input type="tel" required placeholder="N° Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl p-4 outline-none focus:border-[#C59B27]" />
                  <textarea required rows={2} placeholder="Adresse complète (ex: Birkhadem, Centre)..." value={adresse} onChange={(e) => setAdresse(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl p-4 outline-none focus:border-[#C59B27]" />
                  <textarea rows={2} placeholder="Remarque (Optionnel)" value={noteClient} onChange={(e) => setNoteClient(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl p-4 outline-none focus:border-[#C59B27] text-sm" />
                  <button type="submit" disabled={envoiEnCours} className="w-full bg-[#C59B27] text-white font-black py-5 rounded-2xl uppercase text-sm mt-6 disabled:opacity-70 transition-transform active:scale-95 shadow-md">
                    {envoiEnCours ? "Transmission..." : "🚀 Confirmer la commande"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}