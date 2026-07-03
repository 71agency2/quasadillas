"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "produits"; 

export default function AdminDashboard() {
  // --- ÉTAT POUR NAVIGUER ENTRE LES ONGLETS ---
  const [ongletActif, setOngletActif] = useState<"commandes" | "menu">("commandes");

  // --- ÉTATS POUR LA PARTIE COMMANDES ---
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);

  // --- ÉTATS POUR LA PARTIE MENU (PRODUITS) ---
  const [produits, setProduits] = useState<any[]>([]);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messageMenu, setMessageMenu] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingProduit, setEditingProduit] = useState<any | null>(null);

  // Charger toutes les données au démarrage
  useEffect(() => {
    fetchCommandes();
    fetchProduits();
  }, []);

  // --- FONCTIONS POUR LES COMMANDES ---
  async function fetchCommandes() {
    setChargementCommandes(true);
    // On trie par id plutôt que created_at pour éviter les plantages de colonnes manquantes
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .order("id", { ascending: false });
    
    if (error) {
      console.error("Erreur commandes:", error.message);
    } else {
      setCommandes(data || []);
    }
    setChargementCommandes(false);
  }

  async function modifierStatutCommande(id: number, nouveauStatut: string) {
    const { error } = await supabase
      .from("commandes")
      .update({ statut: nouveauStatut })
      .eq("id", id);

    if (!error) {
      fetchCommandes(); // Recharger instantanément la liste
    } else {
      alert("Erreur de changement de statut : " + error.message);
    }
  }

  // --- FONCTIONS POUR LE MENU ---
  async function fetchProduits() {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setProduits(data || []);
  }

  const chargerFormulairePourModification = (produit: any) => {
    setEditingProduit(produit);
    setTitre(produit.titre || produit.nom || "");
    setDescription(produit.description || "");
    setPrix(produit.prix?.toString() || "");
    setImageUrl(produit.image_url || "");
    setImageFile(null);
    setMessageMenu(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerModification = () => {
    setEditingProduit(null);
    setTitre(""); setDescription(""); setPrix(""); setImageUrl("");
    setImageFile(null); setMessageMenu(null);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessageMenu(null);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Erreur bucket : ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const donneesProduit = {
        nom: titre,
        titre: titre,
        description: description,
        prix: parseFloat(prix),
        image_url: finalImageUrl,
      };

      if (editingProduit) {
        const { error } = await supabase.from("produits").update(donneesProduit).eq("id", editingProduit.id);
        if (error) throw error;
        setMessageMenu({ type: "success", text: "🔄 Produit mis à jour !" });
      } else {
        const { error } = await supabase.from("produits").insert([donneesProduit]);
        if (error) throw error;
        setMessageMenu({ type: "success", text: "✅ Produit ajouté au menu !" });
      }

      annulerModification();
      fetchProduits();
    } catch (error: any) {
      setMessageMenu({ type: "error", text: "❌ " + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSupprimerProduit = async (id: number, nomProduit: string) => {
    if (!window.confirm(`Supprimer "${nomProduit}" ?`)) return;
    const { error } = await supabase.from("produits").delete().eq("id", id);
    if (!error) {
      setMessageMenu({ type: "success", text: "🗑️ Produit supprimé." });
      fetchProduits();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-wide">
            Panel Admin - <span className="text-red-600">Food Plus</span>
          </h1>
          <div className="h-1 w-24 bg-red-600 mt-3 rounded-full mx-auto"></div>
        </div>

        {/* --- SYSTEME D'ONGLETS --- */}
        <div className="flex justify-center gap-4 mb-10 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setOngletActif("commandes")}
            className={`py-3 px-6 rounded-xl font-bold uppercase tracking-wider transition-all text-sm ${
              ongletActif === "commandes" 
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                : "bg-zinc-900 text-gray-400 hover:text-white border border-zinc-800"
            }`}
          >
            📦 Commandes ({commandes.length})
          </button>
          <button
            onClick={() => setOngletActif("menu")}
            className={`py-3 px-6 rounded-xl font-bold uppercase tracking-wider transition-all text-sm ${
              ongletActif === "menu" 
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                : "bg-zinc-900 text-gray-400 hover:text-white border border-zinc-800"
            }`}
          >
            🍔 Gestion du Menu
          </button>
        </div>

        {/* --- CONTENU ONGLET 1 : LES COMMANDES --- */}
        {ongletActif === "commandes" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-300">Suivi des commandes</h2>
              <button onClick={fetchCommandes} className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold py-2 px-4 rounded-lg uppercase">
                🔄 Rafraîchir
              </button>
            </div>

            {chargementCommandes ? (
              <div className="text-center py-12 text-gray-500 animate-pulse">Chargement des commandes...</div>
            ) : commandes.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Aucune commande pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {commandes.map((cmd) => (
                  <div key={cmd.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 grow">
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-zinc-800 text-gray-400 px-2 py-1 rounded font-mono">#{cmd.id}</span>
                        <h3 className="font-bold text-lg text-white">{cmd.nom_client}</h3>
                        <span className={`text-xs uppercase font-extrabold px-2 py-1 rounded ${
                          cmd.statut === "en attente" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          cmd.statut === "en cours" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                          "bg-green-500/10 text-green-500 border border-green-500/20"
                        }`}>
                          {cmd.statut}
                        </span>
                      </div>
                      <p className="text-sm text-red-500 font-bold">📞 {cmd.telephone_client || cmd.telephone}</p>
                      <p className="text-sm text-gray-400">📍 {cmd.adresse}</p>
                      <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 mt-2">
                        <p className="text-sm text-gray-300 font-medium"><span className="text-gray-500">Articles :</span> {cmd.details_commande}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 uppercase block">Total</span>
                        <span className="text-2xl font-black text-red-500">{cmd.total} DA</span>
                      </div>
                      
                      <div className="flex gap-1 w-full justify-end">
                        {cmd.statut === "en attente" && (
                          <button onClick={() => modifierStatutCommande(cmd.id, "en cours")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg uppercase">
                            👨‍🍳 Préparer
                          </button>
                        )}
                        {cmd.statut === "en cours" && (
                          <button onClick={() => modifierStatutCommande(cmd.id, "livré")} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-3 rounded-lg uppercase">
                            ✅ Livrer
                          </button>
                        )}
                        <button onClick={async () => {
                          if(window.confirm("Supprimer l'historique de cette commande ?")) {
                            await supabase.from("commandes").delete().eq("id", cmd.id);
                            fetchCommandes();
                          }
                        }} className="bg-zinc-800 hover:bg-red-600/20 hover:text-red-500 text-gray-400 text-xs font-bold py-2 px-2 rounded-lg">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- CONTENU ONGLET 2 : LE MENU (PRODUITS) --- */}
        {ongletActif === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit sticky top-6">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase tracking-wider">
                {editingProduit ? "🔄 Modifier le produit" : "✨ Ajouter un produit"}
              </h2>

              {messageMenu && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${
                  messageMenu.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"
                }`}>
                  {messageMenu.text}
                </div>
              )}

              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Nom du produit</label>
                  <input type="text" required placeholder="Ex: Double Burger Cheese" value={titre} onChange={(e) => setTitre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Prix (DA)</label>
                  <input type="number" required placeholder="Ex: 850" value={prix} onChange={(e) => setPrix(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Description / Ingrédients</label>
                  <textarea rows={3} placeholder="Ex: Pain brioché, 2x steaks..." value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Image du produit</label>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer outline-none" />
                  {editingProduit && imageUrl && !imageFile && (
                    <div className="mt-2 text-xs text-gray-500">Image actuelle conservée.</div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <button type="submit" disabled={uploading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg uppercase tracking-wide text-sm">
                    {uploading ? "Traitement..." : editingProduit ? "💾 Enregistrer" : "➕ Ajouter au menu"}
                  </button>
                  {editingProduit && (
                    <button type="button" onClick={annulerModification} className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold py-2 rounded-lg uppercase text-xs">
                      ❌ Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Liste produits */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider text-gray-300">
                📋 Produits au menu ({produits.length})
              </h2>

              <div className="space-y-4">
                {produits.map((produit) => (
                  <div key={produit.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-4">
                      {produit.image_url && (
                        <img src={produit.image_url} alt={produit.titre} className="w-16 h-16 object-cover rounded-lg bg-zinc-900 border border-zinc-800 shrink-0" />
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-white uppercase">{produit.titre || produit.nom}</h3>
                        <p className="text-sm text-red-500 font-black">{produit.prix} DA</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{produit.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => chargerFormulairePourModification(produit)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase">
                        ✏️ Modifier
                      </button>
                      <button onClick={() => handleSupprimerProduit(produit.id, produit.titre || produit.nom)} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold py-2 px-4 rounded-lg uppercase border border-red-600/20">
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}