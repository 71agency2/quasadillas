"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LivreurPage() {
  // --- ÉTATS D'AUTHENTIFICATION ---
  const [livreur, setLivreur] = useState<{ id: number; nom: string } | null>(null);
  const [saisieTelephone, setSaisieTelephone] = useState("");
  const [saisieMotDePasse, setSaisieMotDePasse] = useState("");
  const [chargementAuth, setChargementAuth] = useState(false);
  const [erreurAuth, setErreurAuth] = useState("");

  // --- ÉTATS COMMANDES ---
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(false);
  const [ongletActif, setOngletActif] = useState<"en_route" | "livre">("en_route");

  // Vérifier si le livreur est déjà connecté au chargement
  useEffect(() => {
    const sessionSauvegardee = localStorage.getItem("livreurSession");
    if (sessionSauvegardee) {
      setLivreur(JSON.parse(sessionSauvegardee));
    }
  }, []);

  // Charger les commandes dès que le livreur est connecté
  useEffect(() => {
    if (livreur) {
      fetchCommandesLivreur();
    }
  }, [livreur]);

  // --- FONCTION DE CONNEXION ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargementAuth(true);
    setErreurAuth("");

    const { data, error } = await supabase
      .from("livreurs")
      .select("*")
      .eq("telephone", saisieTelephone)
      .eq("mot_de_passe", saisieMotDePasse)
      .single();

    setChargementAuth(false);

    if (error || !data) {
      setErreurAuth("Numéro de téléphone ou mot de passe incorrect.");
    } else {
      const sessionData = { id: data.id, nom: data.nom };
      setLivreur(sessionData);
      localStorage.setItem("livreurSession", JSON.stringify(sessionData));
    }
  };

  // --- FONCTION DE DÉCONNEXION ---
  const handleLogout = () => {
    setLivreur(null);
    setCommandes([]);
    localStorage.removeItem("livreurSession");
  };

  // --- RÉCUPÉRATION DES COMMANDES DU LIVREUR ---
  async function fetchCommandesLivreur() {
    if (!livreur) return;
    setChargementCommandes(true);
    
    // On récupère toutes les commandes assignées à ce livreur spécifique
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .eq("livreur_id", livreur.id)
      .order("id", { ascending: false });

    if (!error && data) {
      setCommandes(data);
    }
    setChargementCommandes(false);
  }

  // --- MARQUER UNE COMMANDE COMME LIVRÉE ---
  async function marquerCommeLivre(idCommande: number) {
    if (!window.confirm("Confirmer la livraison de cette commande ?")) return;

    const { error } = await supabase
      .from("commandes")
      .update({ statut: "livré" })
      .eq("id", idCommande);

    if (!error) {
      fetchCommandesLivreur(); // Rafraîchir la liste
    } else {
      alert("Erreur lors de la mise à jour : " + error.message);
    }
  }

  // ==========================================
  // ÉCRAN DE CONNEXION (Si non connecté)
  // ==========================================
  if (!livreur) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <img src="/logo.png" alt="Logo" className="h-20 w-auto mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-black uppercase mb-1">Espace <span className="text-red-600">Livreur</span></h1>
          <p className="text-gray-400 text-xs mb-6 font-bold uppercase tracking-widest">Food Plus Delivery</p>
          
          {erreurAuth && <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-4">{erreurAuth}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="tel" required placeholder="N° de Téléphone" value={saisieTelephone} onChange={(e) => setSaisieTelephone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-center tracking-wider focus:border-red-600 outline-none" />
            <input type="password" required placeholder="Mot de passe" value={saisieMotDePasse} onChange={(e) => setSaisieMotDePasse(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-center tracking-widest focus:border-red-600 outline-none" />
            <button type="submit" disabled={chargementAuth} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-wide mt-2 shadow-xl shadow-red-600/20 active:scale-[0.98] transition-transform">
              {chargementAuth ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // TABLEAU DE BORD LIVREUR (Si connecté)
  // ==========================================
  
  // Filtrer les commandes pour l'affichage des onglets
  const commandesEnRoute = commandes.filter(c => c.statut === "en route");
  const commandesLivrees = commandes.filter(c => c.statut === "livré");
  const commandesAffichees = ongletActif === "en_route" ? commandesEnRoute : commandesLivrees;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER LIVREUR */}
      <header className="bg-zinc-950 border-b border-zinc-900 p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg shadow-red-600/30">🛵</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Livreur Actif</p>
            <p className="font-bold text-white leading-tight">{livreur.nom}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-zinc-900 border border-zinc-800 text-gray-400 p-2 rounded-xl text-xs font-bold uppercase hover:text-white active:scale-95 transition-all">Quitter</button>
      </header>

      {/* ONGLETS */}
      <div className="flex p-4 gap-3">
        <button onClick={() => setOngletActif("en_route")} className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-wider transition-all ${ongletActif === "en_route" ? "bg-red-600 text-white shadow-xl shadow-red-600/20" : "bg-zinc-900 text-gray-500"}`}>
          📦 À Livrer ({commandesEnRoute.length})
        </button>
        <button onClick={() => setOngletActif("livre")} className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-wider transition-all ${ongletActif === "livre" ? "bg-green-600 text-white shadow-xl shadow-green-600/20" : "bg-zinc-900 text-gray-500"}`}>
          ✅ Historique
        </button>
      </div>

      <div className="px-4 flex justify-end mb-2">
        <button onClick={fetchCommandesLivreur} className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1 active:scale-95">
          <span>🔄 Rafraîchir</span>
        </button>
      </div>

      {/* LISTE DES COMMANDES */}
      <main className="px-4">
        {chargementCommandes ? (
          <p className="text-center text-gray-500 py-10 animate-pulse">Chargement de vos courses...</p>
        ) : commandesAffichees.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 mt-4">
            <span className="text-4xl block mb-3">💨</span>
            <p className="text-gray-400 font-bold">Aucune course pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {commandesAffichees.map(cmd => (
              <div key={cmd.id} className={`bg-zinc-950 border p-5 rounded-3xl shadow-xl relative overflow-hidden ${cmd.statut === "en route" ? "border-red-500/30" : "border-zinc-800 opacity-70"}`}>
                
                {/* Liseré de couleur sur le côté gauche pour indiquer le statut */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${cmd.statut === "en route" ? "bg-red-500" : "bg-green-500"}`}></div>

                {/* EN-TÊTE CARTE */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-mono bg-zinc-900 text-gray-400 px-2 py-1 rounded-lg"># {cmd.id}</span>
                    <h3 className="font-black text-xl text-white mt-1">{cmd.nom_client}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">À Encaisser</span>
                    <span className={`text-2xl font-black block ${cmd.statut === "en route" ? "text-red-500" : "text-green-500"}`}>{cmd.total} DA</span>
                  </div>
                </div>

                {/* INFOS CONTACT & ADRESSE */}
                <div className="bg-zinc-900 rounded-2xl p-4 mb-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">📍</span>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Adresse de livraison</span>
                      <p className="font-medium text-white">{cmd.adresse_livraison || cmd.adresse}</p>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-zinc-800"></div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📞</span>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Téléphone</span>
                        <p className="font-bold text-white">{cmd.telephone_client || cmd.telephone}</p>
                      </div>
                    </div>
                    {/* BOUTON APPEL RAPIDE */}
                    {cmd.statut === "en route" && (
                      <a href={`tel:${cmd.telephone_client || cmd.telephone}`} className="bg-green-600/20 text-green-500 border border-green-500/30 p-2 rounded-xl active:scale-95 transition-transform">
                        Appeler
                      </a>
                    )}
                  </div>
                </div>

                {/* DÉTAILS DE LA COMMANDE ET NOTE (whitespace-pre-wrap essentiel ici !) */}
                <div className="mb-5">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Contenu du sac :</p>
                  <div className="bg-black/50 border border-zinc-800/50 rounded-xl p-4">
                    <p className="text-sm text-gray-300 font-medium whitespace-pre-wrap leading-relaxed">{cmd.details_commande}</p>
                  </div>
                </div>

                {/* BOUTON D'ACTION */}
                {cmd.statut === "en route" && (
                  <button onClick={() => marquerCommeLivre(cmd.id)} className="w-full bg-red-600 text-white font-black py-4 rounded-xl uppercase tracking-wider shadow-lg shadow-red-600/20 active:scale-[0.98] transition-transform">
                    ✅ Valider la livraison
                  </button>
                )}
                {cmd.statut === "livré" && (
                  <div className="w-full bg-zinc-900 text-green-500 font-black py-3 rounded-xl uppercase tracking-wider text-center text-sm flex items-center justify-center gap-2">
                    <span>✔️ Livré avec succès</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}