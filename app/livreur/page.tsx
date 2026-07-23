"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LivreurPage() {
  const [estAuthentifie, setEstAuthentifie] = useState(false);
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  
  const [livreurInfo, setLivreurInfo] = useState<any>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(false);

  // Vérifier si le livreur est déjà connecté via le localStorage
  useEffect(() => {
    const savedLivreur = localStorage.getItem("livreurInfo");
    if (savedLivreur) {
      const data = JSON.parse(savedLivreur);
      setLivreurInfo(data);
      setEstAuthentifie(true);
      fetchMesCommandes(data.id);
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setChargement(true);
    
    // Requête pour vérifier l'existence du livreur
    const { data, error } = await supabase
      .from("livreurs")
      .select("*")
      .eq("telephone", telephone)
      .eq("mot_de_passe", motDePasse)
      .single();

    setChargement(false);

    if (data) {
      setLivreurInfo(data);
      setEstAuthentifie(true);
      localStorage.setItem("livreurInfo", JSON.stringify(data));
      fetchMesCommandes(data.id);
    } else {
      alert("❌ Numéro ou mot de passe incorrect");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("livreurInfo");
    setEstAuthentifie(false);
    setLivreurInfo(null);
    setTelephone("");
    setMotDePasse("");
  };

  const fetchMesCommandes = async (idLivreur: number) => {
    setChargement(true);
    const { data } = await supabase
      .from("commandes")
      .select("*")
      .eq("livreur_id", idLivreur)
      .in("statut", ["en route", "livré"]) // On affiche les encours et l'historique récent
      .order("id", { ascending: false });
      
    if (data) setCommandes(data);
    setChargement(false);
  };

  const marquerCommeLivre = async (commandeId: number) => {
    if (!window.confirm("Avez-vous bien remis cette commande au client et encaissé l'argent ?")) return;
    
    await supabase.from("commandes").update({ statut: "livré" }).eq("id", commandeId);
    
    // Rafraichir la liste
    if (livreurInfo) fetchMesCommandes(livreurInfo.id);
  };

  // --- ECRAN DE CONNEXION ---
  if (!estAuthentifie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🛵</div>
          <h1 className="text-2xl font-black uppercase mb-6 tracking-wider">Espace <span className="text-purple-500">Livreur</span></h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input type="tel" required placeholder="Numéro de téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors" />
            </div>
            <div>
              <input type="password" required placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-colors font-mono" />
            </div>
            <button type="submit" disabled={chargement} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl uppercase tracking-widest mt-2">
              {chargement ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ECRAN PRINCIPAL (DASHBOARD LIVREUR) ---
  const commandesEnRoute = commandes.filter(c => c.statut === "en route");
  const commandesLivrees = commandes.filter(c => c.statut === "livré");

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 font-sans pb-24">
      {/* En-tête */}
      <header className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 flex justify-between items-center shadow-lg">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Connecté en tant que</p>
          <h2 className="text-xl font-black text-white">{livreurInfo?.nom}</h2>
        </div>
        <button onClick={handleLogout} className="bg-red-500/10 text-red-500 font-bold px-4 py-2 rounded-xl text-sm border border-red-500/20">Quitter</button>
      </header>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4 text-center">
          <span className="text-3xl font-black text-purple-400 block mb-1">{commandesEnRoute.length}</span>
          <span className="text-xs uppercase font-bold text-purple-300">À Livrer</span>
        </div>
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 text-center">
          <span className="text-3xl font-black text-green-400 block mb-1">{commandesLivrees.length}</span>
          <span className="text-xs uppercase font-bold text-green-300">Déjà Livrées</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black uppercase tracking-widest text-gray-300">Vos courses actuelles</h3>
        <button onClick={() => fetchMesCommandes(livreurInfo?.id)} className="text-sm bg-zinc-900 px-3 py-1 rounded-lg text-gray-400 border border-zinc-800">🔄 Actu</button>
      </div>

      {chargement && commandes.length === 0 ? (
        <div className="text-center py-10 text-gray-500 animate-pulse font-bold">Mise à jour GPS...</div>
      ) : commandesEnRoute.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center mt-6">
          <span className="text-5xl block mb-4">☕</span>
          <p className="text-gray-400 font-medium">Aucune commande en cours.</p>
          <p className="text-sm text-gray-500 mt-2">Restez à l'affût des assignations !</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commandesEnRoute.map((cmd) => (
            <div key={cmd.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
              {/* Entête de la carte */}
              <div className="bg-purple-600 p-4 flex justify-between items-center">
                <span className="bg-black/20 text-white px-3 py-1 rounded-lg font-mono font-bold text-sm">#{cmd.id}</span>
                <span className="font-black text-xl">{cmd.total} DA</span>
              </div>
              
              {/* Corps de la carte */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Client</p>
                  <p className="text-lg font-bold">{cmd.nom_client}</p>
                  <a href={`tel:${cmd.telephone_client}`} className="inline-flex items-center gap-2 bg-zinc-800 text-blue-400 px-4 py-2 rounded-xl mt-2 font-bold w-full justify-center border border-zinc-700">
                    📞 Appeler : {cmd.telephone_client}
                  </a>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">📍 Adresse</p>
                  <p className="text-gray-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-medium">{cmd.adresse_livraison}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Détails repas</p>
                  <p className="text-sm text-gray-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800 whitespace-pre-wrap">{cmd.details_commande}</p>
                </div>

                <button onClick={() => marquerCommeLivre(cmd.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl uppercase tracking-wider text-sm shadow-lg shadow-green-600/20 active:scale-95 transition-all mt-4">
                  ✅ Valider la livraison
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
