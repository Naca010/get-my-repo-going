// @ts-nocheck
export interface BankTheme {
  primary: string;
  headerBg: string;
  buttonBg: string;
  accentText: string;
  topBarColor: string;
  buttonRadius?: string;
  footerBg?: string;
}

export const bankGroupThemes: Record<string, BankTheme> = {
  "Volksbanken Raiffeisenbanken": {
    primary: "20 100% 50%",
    headerBg: "#ffffff",
    buttonBg: "#ff6600",
    accentText: "#ff6600",
    topBarColor: "#ff6600",
    buttonRadius: "rounded-full",
  },
  "PSD Banken": {
    primary: "153 100% 22%",
    headerBg: "#006b3f",
    buttonBg: "#d4960a",
    accentText: "#006b3f",
    topBarColor: "#c8a415",
    buttonRadius: "rounded-none",
  },
  "GLS Bank": {
    primary: "145 100% 35%",
    headerBg: "#ffffff",
    buttonBg: "#00a651",
    accentText: "#00a651",
    topBarColor: "#00a651",
    footerBg: "#00a651",
    buttonRadius: "rounded-none",
  },
  "Sparda-Banken": {
    primary: "210 100% 25%",
    headerBg: "#003b7e",
    buttonBg: "#003b7e",
    accentText: "#d45500",
    topBarColor: "#003b7e",
  },
  "BBBank": {
    primary: "207 100% 33%",
    headerBg: "#ffffff",
    buttonBg: "#0056a3",
    accentText: "#0056a3",
    topBarColor: "#0056a3",
    buttonRadius: "rounded-none",
  },
};

export interface Bank {
  id: string;
  name: string;
  group: string;
  blz?: string;
  aliases?: string[];
  keywords?: string[];
  customTheme?: BankTheme;
  logo?: string;
  hideNameInHeader?: boolean;
  onlineBankingUrl?: string;
  unverified?: boolean;
}

export const banks: Bank[] = [
  // ─── Volksbanken Raiffeisenbanken (von Wikipedia) ─────────────────────
  { id: "vr-bank-niederbayern-oberpfalz-eg", name: "VR Bank Niederbayern-Oberpfalz eG", group: "Volksbanken Raiffeisenbanken", blz: "75090900", keywords: ["passau", "regensburg", "niederbayern", "oberpfalz", "GENODEF1P18"], aliases: ["meine-bank-no"], customTheme: { primary: "82 72% 40%", headerBg: "#ffffff", buttonBg: "#76B900", accentText: "#76B900", topBarColor: "#76B900" }, logo: "vr-bank-no-logo", hideNameInHeader: true , onlineBankingUrl: "https://www.meine-bank-no.de/services_cloud/portal" },
  { id: "volksbank-ueberherrn-eg", name: "Volksbank Überherrn eG", group: "Volksbanken Raiffeisenbanken", blz: "59391200", keywords: ["überherrn", "ueberherrn", "66802", "saarland", "GENODE51UBH"], onlineBankingUrl: "https://www.vb-ueberherrn.de/services_cloud/portal/" },
  { id: "volksbank-krefeld-eg", name: "Volksbank Krefeld eG", group: "Volksbanken Raiffeisenbanken", blz: "32060362", keywords: ["krefeld", "vbkrefeld", "GENODED1HTK"], onlineBankingUrl: "https://www.vbkrefeld.de/services_cloud/portal/" },
  { id: "volksbank-darmstadt-mainz-eg", name: "Volksbank Darmstadt Mainz eG", group: "Volksbanken Raiffeisenbanken", blz: "50890000", keywords: ["darmstadt", "mainz", "rhein-main", "GENODEF1VBD", "volksbanking"], onlineBankingUrl: "https://www.volksbanking.de/services_cloud/portal/" },
  { id: "vr-bank-ostalb-eg", name: "VR-Bank Ostalb eG", group: "Volksbanken Raiffeisenbanken", blz: "61490150", keywords: ["aalen"] , onlineBankingUrl: "https://www.vrbank-ostalb.de/services_cloud/portal" },
  { id: "abtsgmuender-bank-eg", name: "Abtsgmünder Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "60069673", keywords: ["abtsgmünd"] , onlineBankingUrl: "https://www.abtsgmuender-bank.de/services_cloud/portal" },
  { id: "raiffeisenbank-aidlingen-eg", name: "Raiffeisenbank Aidlingen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069206", keywords: ["aidlingen"] , onlineBankingUrl: "https://www.IhrZiel.de/services_cloud/portal" },
  { id: "onstmettinger-bank-eg", name: "Onstmettinger Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "65361989", keywords: ["albstadt"] , onlineBankingUrl: "https://www.onstmettinger-bank.de/services_cloud/portal" },
  { id: "volksbank-backnang-eg", name: "Volksbank Backnang eG", group: "Volksbanken Raiffeisenbanken", blz: "60291120", keywords: ["backnang"] , onlineBankingUrl: "https://www.volksbank-backnang.de/services_cloud/portal" },
  { id: "bank-1-saar-eg", name: "Bank 1 Saar eG", group: "Volksbanken Raiffeisenbanken", blz: "59190000", keywords: ["saarbrücken", "saarland", "66111", "SABADE5S"], onlineBankingUrl: "https://www.bank1saar.de/services_cloud/portal" },
  { id: "raiffeisenbank-bad-saulgau-eg", name: "Raiffeisenbank Bad Saulgau eG", group: "Volksbanken Raiffeisenbanken", blz: "65063086", keywords: ["bad saulgau"], onlineBankingUrl: "https://www.onlinebankservice.de/genoweb/homebank.nsf/(rzbks)/xxk1327x?OpenDocument" },
  { id: "vr-bank-donau-oberschwaben-eg", name: "VR Bank Donau-Oberschwaben eG", group: "Volksbanken Raiffeisenbanken", blz: "65093020", keywords: ["bad saulgau"], onlineBankingUrl: "https://www.vrdo.de/services_cloud/portal" },
  { id: "raiffeisenbank-reute-gaisbeuren-eg", name: "Raiffeisenbank Reute-Gaisbeuren eG", group: "Volksbanken Raiffeisenbanken", blz: "60069350", keywords: ["bad waldsee"], onlineBankingUrl: "https://finanzportal.fiducia.de/ebpg07/entry?rzid=XC&rzbk=1267" },
  { id: "volksbank-zollernalb-eg", name: "Volksbank Zollernalb eG", group: "Volksbanken Raiffeisenbanken", blz: "65390120", keywords: ["balingen"] , onlineBankingUrl: "https://www.volksbank-albstadt.de/services_cloud/portal" },
  { id: "volksbank-beilstein-ilsfeld-abstatt-eg", name: "Volksbank Beilstein-Ilsfeld-Abstatt eG", group: "Volksbanken Raiffeisenbanken", blz: "62062215", keywords: ["beilstein"] , onlineBankingUrl: "https://www.vb-bia.de/services_cloud/portal" },
  { id: "raiffeisenbank-berghuelen-eg", name: "Raiffeisenbank Berghülen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069931", keywords: ["berghülen"] , onlineBankingUrl: "https://www.rb-berghuelen.de/services_cloud/portal" },
  { id: "raiffeisenbank-gammesfeld-eg", name: "Raiffeisenbank Gammesfeld eG", group: "Volksbanken Raiffeisenbanken", blz: "60069710", keywords: ["blaufelden"] },
  { id: "bopfinger-bank-sechta-ries-eg", name: "Bopfinger Bank Sechta-Ries eG", group: "Volksbanken Raiffeisenbanken", blz: "60069239", keywords: ["bopfingen"] , onlineBankingUrl: "https://www.bopfinger-bank.de/services_cloud/portal" },
  { id: "vbu-volksbank-im-unterland-eg", name: "VBU Volksbank im Unterland eG", group: "Volksbanken Raiffeisenbanken", blz: "62063263", keywords: ["brackenheim"] , onlineBankingUrl: "https://www.vbu-volksbank.de/services_cloud/portal" },
  { id: "volksbank-breisgau-markgraeflerland-eg", name: "Volksbank Breisgau-Markgräflerland eG", group: "Volksbanken Raiffeisenbanken", blz: "68061505", keywords: ["breisach am rhein"], onlineBankingUrl: "https://www.volksbank-breisgau-markgraeflerland.de/services_cloud/portal" },
  { id: "volksbank-franken-eg", name: "Volksbank Franken eG", group: "Volksbanken Raiffeisenbanken", blz: "67461424", keywords: ["buchen"] , onlineBankingUrl: "https://www.volksbank-franken.de/services_cloud/portal" },
  { id: "raiffeisenbank-altschweier-eg", name: "Raiffeisenbank Altschweier eG", group: "Volksbanken Raiffeisenbanken", blz: "66261416", keywords: ["bühl"] , onlineBankingUrl: "https://www.raiba-altschweier.de/services_cloud/portal" },
  { id: "volksbank-buehl-eg", name: "Volksbank Bühl eG", group: "Volksbanken Raiffeisenbanken", blz: "66291400", keywords: ["bühl"] , onlineBankingUrl: "https://www.volksbank-buehl.de/services_cloud/portal" },
  { id: "spar-und-kreditbank-buehlertal-eg", name: "Spar- und Kreditbank Bühlertal eG", group: "Volksbanken Raiffeisenbanken", blz: "66261092", keywords: ["bühlertal"] , onlineBankingUrl: "https://www.skb-buehlertal.de/services_cloud/portal" },
  { id: "volksbank-deisslingen-eg", name: "Volksbank Deisslingen eG", group: "Volksbanken Raiffeisenbanken", blz: "64291420", keywords: ["deißlingen"] , onlineBankingUrl: "https://www.voba-deisslingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-denzlingen-sexau-eg", name: "Raiffeisenbank Denzlingen-Sexau eG", group: "Volksbanken Raiffeisenbanken", blz: "68062105", keywords: ["denzlingen"] , onlineBankingUrl: "https://www.rb-denzlingen-sexau.de/services_cloud/portal" },
  { id: "volksbank-dettenhausen-eg", name: "Volksbank Dettenhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069378", keywords: ["dettenhausen"] , onlineBankingUrl: "https://www.volksbank-dettenhausen.de/services_cloud/portal" },
  { id: "raiffeisenbank-hardt-bruhrain-eg", name: "Raiffeisenbank Hardt-Bruhrain eG", group: "Volksbanken Raiffeisenbanken", blz: "66062366", keywords: ["dettenheim"] , onlineBankingUrl: "https://www.rb-hardt-bruhrain.de/services_cloud/portal" },
  { id: "dettinger-bank-eg", name: "Dettinger Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "60069387", keywords: ["dettingen an der erms"] },
  { id: "raiffeisenbank-suedhardt-eg", name: "Raiffeisenbank Südhardt eG", group: "Volksbanken Raiffeisenbanken", blz: "66562053", keywords: ["durmersheim"] , onlineBankingUrl: "https://www.raiba-suedhardt.de/services_cloud/portal" },
  { id: "donau-iller-bank-eg", name: "Donau-Iller Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "63091010", keywords: ["ehingen"] , onlineBankingUrl: "https://www.donau-iller-bank.de/services_cloud/portal" },
  { id: "vr-bank-alb-blau-donau-eg", name: "VR-Bank Alb-Blau-Donau eG", group: "Volksbanken Raiffeisenbanken", blz: "60069346", keywords: ["ehingen"] , onlineBankingUrl: "https://www.vrbankabd.de/services_cloud/portal" },
  { id: "vr-bank-ehningen-nufringen-eg", name: "VR-Bank Ehningen-Nufringen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069355", keywords: ["ehningen"] , onlineBankingUrl: "https://www.vrben.de/services_cloud/portal" },
  { id: "vr-bank-ellwangen-eg", name: "VR-Bank Ellwangen eG", group: "Volksbanken Raiffeisenbanken", blz: "61491010", keywords: ["ellwangen"] , onlineBankingUrl: "https://www.vrbank-ellwangen.de/services_cloud/portal" },
  { id: "raiffeisenbank-eg", name: "Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "66069103", keywords: ["elztal"] , onlineBankingUrl: "https://www.raiffeisenbank-elztal.de/services_cloud/portal" },
  { id: "volksbank-breisgau-nord-eg", name: "Volksbank Breisgau Nord eG", group: "Volksbanken Raiffeisenbanken", blz: "68092000", keywords: ["emmendingen"] , onlineBankingUrl: "https://www.voba-breisgau-nord.de/services_cloud/portal" },
  { id: "raiffeisenbank-erlenbach-eg", name: "Raiffeisenbank Erlenbach eG", group: "Volksbanken Raiffeisenbanken", blz: "60069911", keywords: ["erlenbach"] , onlineBankingUrl: "https://www.raiffeisenbank-erlenbach.de/services_cloud/portal" },
  { id: "volksbank-mittlerer-neckar-eg", name: "Volksbank Mittlerer Neckar eG", group: "Volksbanken Raiffeisenbanken", blz: "61290120", keywords: ["esslingen am neckar"], onlineBankingUrl: "https://www.onlinebankservice2.de/banking.jsp?rz=RWG&bank=0057" },
  { id: "volksbank-ettlingen-eg", name: "Volksbank Ettlingen eG", group: "Volksbanken Raiffeisenbanken", blz: "66091200", keywords: ["ettlingen"] , onlineBankingUrl: "https://www.volksbank-ettlingen.de/services_cloud/portal" },
  { id: "volksbank-am-wuerttemberg-eg", name: "Volksbank am Württemberg eG", group: "Volksbanken Raiffeisenbanken", blz: "60060396", keywords: ["fellbach"] , onlineBankingUrl: "https://www.voba-aw.de/services_cloud/portal" },
  { id: "bernhauser-bank-eg", name: "Bernhauser Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "61262345", keywords: ["filderstadt"] , onlineBankingUrl: "https://www.bernhauser-bank.de/services_cloud/portal", logo: "bernhauser-bank-logo", hideNameInHeader: true },
  { id: "volksbank-filder-eg", name: "Volksbank Filder eG", group: "Volksbanken Raiffeisenbanken", blz: "61161696", keywords: ["filderstadt"] , onlineBankingUrl: "https://www.volksbank-filder.de/services_cloud/portal" },
  { id: "volksbank-flein-talheim-eg", name: "Volksbank Flein-Talheim eG", group: "Volksbanken Raiffeisenbanken", blz: "62062643", keywords: ["flein"] , onlineBankingUrl: "https://www.vb-flein-talheim.de/services_cloud/portal" },
  { id: "volksbank-freiburg-eg", name: "Volksbank Freiburg eG", group: "Volksbanken Raiffeisenbanken", blz: "68090000", keywords: ["freiburg im breisgau"], onlineBankingUrl: "https://www.volksbank-freiburg.de/banking-private/entry?trackid=piwika8723d7dd1c62703" },
  { id: "volksbank-nordschwarzwald-eg", name: "Volksbank Nordschwarzwald eG", group: "Volksbanken Raiffeisenbanken", blz: "64291010", keywords: ["freudenstadt"] , onlineBankingUrl: "https://www.voba-fds.de/services_cloud/portal" },
  { id: "raiffeisenbank-donau-heuberg-eg", name: "Raiffeisenbank Donau-Heuberg eG", group: "Volksbanken Raiffeisenbanken", blz: "64361359", keywords: ["fridingen an der donau"] },
  { id: "raiffeisenbank-geislingen-rosenfeld-eg", name: "Raiffeisenbank Geislingen-Rosenfeld eG", group: "Volksbanken Raiffeisenbanken", blz: "65362499", keywords: ["geislingen"], onlineBankingUrl: "https://www.raiba-gr.de/banking-private/entry" },
  { id: "volksbank-brenztal-eg", name: "Volksbank Brenztal eG", group: "Volksbanken Raiffeisenbanken", blz: "60069527", keywords: ["giengen an der brenz"], onlineBankingUrl: "https://www.volksbank-brenztal.de/banking-private/entry" },
  { id: "raiffeisenbank-maitis-eg", name: "Raiffeisenbank Maitis eG", group: "Volksbanken Raiffeisenbanken", blz: "60069336", keywords: ["göppingen"] , onlineBankingUrl: "https://www.raiffeisenbank-maitis.de/services_cloud/portal" },
  { id: "volksbank-goeppingen-eg", name: "Volksbank Göppingen eG", group: "Volksbanken Raiffeisenbanken", blz: "61060500", keywords: ["göppingen"] , onlineBankingUrl: "https://www.volksbank-goeppingen.de/services_cloud/portal" },
  { id: "anmerkung-3-eg", name: "Raiffeisenbank Gruibingen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069242", keywords: ["gruibingen"], logo: "raiffeisenbank-gruibingen-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.raiffeisenbank-gruibingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-breisgau-eg", name: "Raiffeisenbank im Breisgau eG", group: "Volksbanken Raiffeisenbanken", blz: "68064222", keywords: ["gundelfingen"] },
  { id: "hagnauer-volksbank-eg", name: "Hagnauer Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "69091200", keywords: ["hagnau am bodensee"], logo: "hagnauer-volksbank-logo", hideNameInHeader: true, onlineBankingUrl: "https://finanzportal.fiducia.de/entry?appid=ebpe&bankid=XC0421" },
  { id: "raiffeisenbank-aichhalden-hardt-sulgen-e", name: "Raiffeisenbank Aichhalden-Hardt-Sulgen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069553", keywords: ["hardt"] , onlineBankingUrl: "https://www.raibadirekt.de/services_cloud/portal" },
  { id: "volksbank-heidelberg-neckartal-eg", name: "Volksbank Heidelberg-Neckartal eG", group: "Volksbanken Raiffeisenbanken", blz: "67291700", keywords: ["heidelberg"] , onlineBankingUrl: "https://www.volksbank-neckartal.de/services_cloud/portal" },
  { id: "volksbank-kurpfalz-eg", name: "Volksbank Kurpfalz eG", group: "Volksbanken Raiffeisenbanken", blz: "67092300", keywords: ["heidelberg"] , onlineBankingUrl: "https://www.volksbank-kurpfalz.de/services_cloud/portal" },
  { id: "heidenheimer-volksbank-eg", name: "Heidenheimer Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "63290110", keywords: ["heidenheim an der brenz"], onlineBankingUrl: "https://finanzportal.fiducia.de/entry?bankid=XC0147&appid=ebpe" },
  { id: "raiffeisenbank-boellingertal-eg", name: "Raiffeisenbank Böllingertal eG", group: "Volksbanken Raiffeisenbanken", blz: "60069976", keywords: ["heilbronn"] , onlineBankingUrl: "https://www.raiba-boellingertal.de/services_cloud/portal" },
  { id: "raiffeisenbank-rosenstein-eg", name: "Raiffeisenbank Rosenstein eG", group: "Volksbanken Raiffeisenbanken", blz: "61361722", keywords: ["heubach"] , onlineBankingUrl: "https://www.raiffeisenbank-rosenstein.de/services_cloud/portal" },
  { id: "vr-bank-in-mittelbaden-eg", name: "VR-Bank in Mittelbaden eG", group: "Volksbanken Raiffeisenbanken", blz: "66562300", keywords: ["iffezheim"] , onlineBankingUrl: "https://www.vr-miba.de/services_cloud/portal" },
  { id: "raiffeisenbank-hohenloher-land-eg", name: "Raiffeisenbank Hohenloher Land eG", group: "Volksbanken Raiffeisenbanken", blz: "60069714", keywords: ["ingelfingen"] , onlineBankingUrl: "https://www.rb-hl.de/services_cloud/portal" },
  { id: "raiffeisenbank-ersingen-eg", name: "Raiffeisenbank Ersingen eG", group: "Volksbanken Raiffeisenbanken", blz: "66662155", keywords: ["kämpfelbach"] , onlineBankingUrl: "https://www.raiffeisenbankersingen.de/services_cloud/portal" },
  { id: "volksbank-pur-eg", name: "Volksbank pur eG", group: "Volksbanken Raiffeisenbanken", blz: "66190000", keywords: ["karlsruhe"] , onlineBankingUrl: "https://www.volksbank-pur.de/services_cloud/portal" },
  { id: "raiffeisenbank-kieselbronn-eg", name: "Raiffeisenbank Kieselbronn eG", group: "Volksbanken Raiffeisenbanken", blz: "66661329", keywords: ["kieselbronn"] , onlineBankingUrl: "https://www.rb-kieselbronn.de/services_cloud/portal" },
  { id: "volksbank-lahr-eg", name: "Volksbank Lahr eG", group: "Volksbanken Raiffeisenbanken", blz: "68290000", keywords: ["lahr"] },
  { id: "raiffeisenbank-niedere-alb-eg", name: "Raiffeisenbank Niedere Alb eG", group: "Volksbanken Raiffeisenbanken", blz: "60069066", keywords: ["langenau"] , onlineBankingUrl: "https://www.rb-niedere-alb.de/services_cloud/portal" },
  { id: "volksbank-alb-eg", name: "Volksbank Alb eG", group: "Volksbanken Raiffeisenbanken", blz: "63091300", keywords: ["langenau"] , onlineBankingUrl: "https://www.voba-alb.de/services_cloud/portal" },
  { id: "echterdinger-bank-eg", name: "Echterdinger Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "60062775", keywords: ["leinfelden-echterdingen"] , onlineBankingUrl: "https://www.echterdinger-bank.de/services_cloud/portal" },
  { id: "volksbank-leonberg-strohgaeu-eg", name: "Volksbank Leonberg-Strohgäu eG", group: "Volksbanken Raiffeisenbanken", blz: "60390300", keywords: ["leonberg"] , onlineBankingUrl: "https://www.vbleos.de/services_cloud/portal" },
  { id: "volksbank-allgaeu-oberschwaben-eg", name: "Volksbank Allgäu-Oberschwaben eG", group: "Volksbanken Raiffeisenbanken", blz: "65091040", keywords: ["leutkirch im allgäu"], onlineBankingUrl: "https://www.volksbank-allgaeu-oberschwaben.de/" },
  { id: "volksbank-limbach-eg", name: "Volksbank Limbach eG", group: "Volksbanken Raiffeisenbanken", blz: "67462368", keywords: ["limbach"] , onlineBankingUrl: "https://www.vb-limbach.de/services_cloud/portal" },
  { id: "volksbank-dreilaendereck-eg", name: "Volksbank Dreiländereck eG", group: "Volksbanken Raiffeisenbanken", blz: "68390000", keywords: ["lörrach"] , onlineBankingUrl: "https://www.vb3.de/services_cloud/portal" },
  { id: "vr-bank-ludwigsburg-eg", name: "VR-Bank Ludwigsburg eG", group: "Volksbanken Raiffeisenbanken", blz: "60491430", keywords: ["ludwigsburg"] , onlineBankingUrl: "https://www.vrbank-lb.de/services_cloud/portal" },
  { id: "volksbank-sandhofen-eg", name: "Volksbank Sandhofen eG", group: "Volksbanken Raiffeisenbanken", blz: "67060031", keywords: ["mannheim"] , onlineBankingUrl: "https://www.vobasandhofen.de/services_cloud/portal" },
  { id: "vr-bank-rhein-neckar-eg", name: "VR Bank Rhein-Neckar eG", group: "Volksbanken Raiffeisenbanken", blz: "67090000", keywords: ["mannheim"] , onlineBankingUrl: "https://www.vrbank.de/services_cloud/portal" },
  { id: "volksbank-ermstal-alb-eg", name: "Volksbank Ermstal-Alb eG", group: "Volksbanken Raiffeisenbanken", blz: "64091200", keywords: ["metzingen"] , onlineBankingUrl: "https://www.voba-ermstal-alb.de/services_cloud/portal" },
  { id: "volksbank-moeckmuehl-eg", name: "Volksbank Möckmühl eG", group: "Volksbanken Raiffeisenbanken", blz: "62091600", keywords: ["möckmühl"] , onlineBankingUrl: "https://www.voba-moeckmuehl.de/services_cloud/portal" },
  { id: "volksbank-muensingen-eg", name: "Volksbank Münsingen eG", group: "Volksbanken Raiffeisenbanken", blz: "64091300", keywords: ["münsingen"] , onlineBankingUrl: "https://www.volksbank-muensingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-kreis-calw-eg", name: "Raiffeisenbank im Kreis Calw eG", group: "Volksbanken Raiffeisenbanken", blz: "60663084", keywords: ["neubulach"] , onlineBankingUrl: "https://www.raibacalw.de/services_cloud/portal" },
  { id: "volksbank-sulmtal-eg", name: "Volksbank Sulmtal eG", group: "Volksbanken Raiffeisenbanken", blz: "62061991", keywords: ["obersulm"] , onlineBankingUrl: "https://www.volksbank-sulmtal.de/services_cloud/portal" },
  { id: "raiffeisenbank-oberteuringen-meckenbeure", name: "Raiffeisenbank Oberteuringen-Meckenbeuren eG", group: "Volksbanken Raiffeisenbanken", blz: "65162832", keywords: ["oberteuringen"] , onlineBankingUrl: "https://www.rb-om.de/services_cloud/portal" },
  { id: "volksbank-eg", name: "Volksbank eG – Die Gestalterbank", group: "Volksbanken Raiffeisenbanken", blz: "66490000", keywords: ["offenburg", "gestalterbank", "GENODE61OG1"] , onlineBankingUrl: "https://www.gestalterbank.de/services_cloud/portal" },
  { id: "volksbank-hohenlohe-eg", name: "Volksbank Hohenlohe eG", group: "Volksbanken Raiffeisenbanken", blz: "62091800", keywords: ["öhringen"] , onlineBankingUrl: "https://www.vb-hohenlohe.de/services_cloud/portal" },
  { id: "anmerkung-3-eg-9457", name: "Raiffeisenbank Ottenbach eG", group: "Volksbanken Raiffeisenbanken", blz: "60069457", keywords: ["ottenbach"], logo: "raiffeisenbank-ottenbach-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.raiffeisenbank-ottenbach.de/services_cloud/portal" },
  { id: "volksbank-pfullendorf-eg", name: "Volksbank Pfullendorf eG", group: "Volksbanken Raiffeisenbanken", blz: "69091600", keywords: ["pfullendorf"] , onlineBankingUrl: "https://www.volksbank-pfullendorf.de/services_cloud/portal" },
  { id: "volksbank-plochingen-eg", name: "Volksbank Plochingen eG", group: "Volksbanken Raiffeisenbanken", blz: "61191310", keywords: ["plochingen"] , onlineBankingUrl: "https://www.volksbank-plochingen.de/services_cloud/portal" },
  { id: "volksbank-remseck-eg", name: "Volksbank Remseck eG", group: "Volksbanken Raiffeisenbanken", blz: "60069905", keywords: ["remseck am neckar"], onlineBankingUrl: "https://finanzportal.fiducia.de/p14pepe/entry?rzid=XC&rzbk=0731" },
  { id: "raiffeisenbank-sondelfingen-eg", name: "Raiffeisenbank Sondelfingen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069147", keywords: ["reutlingen"] , onlineBankingUrl: "https://www.rb-sondelfingen.de/services_cloud/portal" },
  { id: "spar-und-kreditbank-rheinstetten-eg", name: "Spar- und Kreditbank Rheinstetten eG", group: "Volksbanken Raiffeisenbanken", blz: "66061407", keywords: ["rheinstetten"] , onlineBankingUrl: "https://www.skb-rheinstetten.de/services_cloud/portal" },
  { id: "volksbank-kirnau-krautheim-eg", name: "Volksbank Kirnau-Krautheim eG", group: "Volksbanken Raiffeisenbanken", blz: "67461733", keywords: ["rosenberg"], onlineBankingUrl: "https://www.vb-kirnau-krautheim.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-ammergaeu-eg", name: "Volksbank Raiffeisenbank AmmerGäu eG", group: "Volksbanken Raiffeisenbanken", blz: "64161397", keywords: ["rottenburg am neckar"] },
  { id: "volksbank-rottweil-eg", name: "Volksbank Rottweil eG", group: "Volksbanken Raiffeisenbanken", blz: "64290120", keywords: ["rottweil"] , onlineBankingUrl: "https://www.volksbank-rottweil.de/services_cloud/portal" },
  { id: "raiffeisenbank-schrozberg-rot-am-see-eg", name: "Raiffeisenbank Schrozberg-Rot am See eG", group: "Volksbanken Raiffeisenbanken", blz: "60069595", keywords: ["schrozberg"] , onlineBankingUrl: "https://www.unsere-raiba.de/services_cloud/portal" },
  { id: "raiffeisenbank-tuengental-eg", name: "Raiffeisenbank Tüngental eG", group: "Volksbanken Raiffeisenbanken", blz: "60069950", keywords: ["schwäbisch hall"], onlineBankingUrl: "https://www.onlinebanking-raiba-tuengental.de/services_cloud/portal" },
  { id: "vr-bank-heilbronn-schwaebisch-hall-eg", name: "VR Bank Heilbronn Schwäbisch Hall eG", group: "Volksbanken Raiffeisenbanken", blz: "62290110", keywords: ["schwäbisch hall"], onlineBankingUrl: "https://finanzportal.fiducia.de/p14pepe/entry?rzid=XC&rzbk=1836" },
  { id: "vereinigte-volksbanken-eg", name: "Vereinigte Volksbanken eG", group: "Volksbanken Raiffeisenbanken", blz: "60390000", keywords: ["sindelfingen"] , onlineBankingUrl: "https://www.diebank.de/services_cloud/portal" },
  { id: "volksbank-rot-eg", name: "Volksbank Rot eG", group: "Volksbanken Raiffeisenbanken", blz: "67262550", keywords: ["st. leon-rot"] },
  { id: "volksbank-staufen-eg", name: "Volksbank Staufen eG", group: "Volksbanken Raiffeisenbanken", blz: "68092300", keywords: ["staufen im breisgau"] },
  { id: "raiffeisenbank-frankenhardt-stimpfach-eg", name: "Raiffeisenbank Frankenhardt-Stimpfach eG", group: "Volksbanken Raiffeisenbanken", blz: "60069442", keywords: ["stimpfach"] , onlineBankingUrl: "https://www.rb-frankenhardt-stimpfach.de/services_cloud/portal" },
  { id: "volksbank-stuttgart-eg", name: "Volksbank Stuttgart eG", group: "Volksbanken Raiffeisenbanken", blz: "60090100", keywords: ["stuttgart"] , onlineBankingUrl: "https://www.volksbank-stuttgart.de/services_cloud/portal" },
  { id: "volksbank-zuffenhausen-eg", name: "Volksbank Zuffenhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "60090300", keywords: ["stuttgart"] , onlineBankingUrl: "https://www.voba-zuff.de/services_cloud/portal" },
  { id: "ihre-volksbank-eg-neckar-odenwald-main-t", name: "Ihre Volksbank eG Neckar Odenwald Main Tauber", group: "Volksbanken Raiffeisenbanken", blz: "67390000", keywords: ["tauberbischofsheim"] , onlineBankingUrl: "https://www.vobamt.de/services_cloud/portal" },
  { id: "volksbank-bodensee-oberschwaben-eg", name: "Volksbank Bodensee-Oberschwaben eG", group: "Volksbanken Raiffeisenbanken", blz: "65191500", keywords: ["tettnang"] , onlineBankingUrl: "https://www.vb-bo.de/services_cloud/portal" },
  { id: "volksbank-trossingen-eg", name: "Volksbank Trossingen eG", group: "Volksbanken Raiffeisenbanken", blz: "64292310", keywords: ["trossingen"] , onlineBankingUrl: "https://www.volksbank-trossingen.de/services_cloud/portal" },
  { id: "volksbank-in-der-region-eg", name: "Volksbank in der Region eG", group: "Volksbanken Raiffeisenbanken", blz: "60391310", keywords: ["tübingen"] , onlineBankingUrl: "https://www.vbidr.de/services_cloud/portal" },
  { id: "volksbank-schwarzwald-donau-neckar-eg", name: "Volksbank Schwarzwald-Donau-Neckar eG", group: "Volksbanken Raiffeisenbanken", blz: "64390130", keywords: ["tuttlingen"] , onlineBankingUrl: "https://www.vbsdn.de/services_cloud/portal" },
  { id: "volksbank-eg-1800", name: "Volksbank Überlingen eG", group: "Volksbanken Raiffeisenbanken", blz: "69061800", keywords: ["überlingen", "88662"] , onlineBankingUrl: "https://www.volksbank-ueberlingen.de/services_cloud/portal" },
  { id: "volksbank-ulm-biberach-eg", name: "Volksbank Ulm-Biberach eG", group: "Volksbanken Raiffeisenbanken", blz: "63090100", keywords: ["ulm"], onlineBankingUrl: "https://www.volksbank-ulm-biberach.de/services_cloud/portal?trackid=piwik694fffa3702e7d38" },
  { id: "raiffeisenbank-buehlertal-eg", name: "Raiffeisenbank Bühlertal eG", group: "Volksbanken Raiffeisenbanken", blz: "60069075", keywords: ["vellberg"] , onlineBankingUrl: "https://www.raiba-buehlertal.de/services_cloud/portal" },
  { id: "raiffeisenbank-kaiserstuhl-eg", name: "Raiffeisenbank Kaiserstuhl eG", group: "Volksbanken Raiffeisenbanken", blz: "68063479", keywords: ["vogtsburg im kaiserstuhl"], onlineBankingUrl: "https://www.raiffeisenbank-kaiserstuhl.de/services_cloud/portal" },
  { id: "volksbank-hochrhein-eg", name: "Volksbank Hochrhein eG", group: "Volksbanken Raiffeisenbanken", blz: "68492200", keywords: ["waldshut-tiengen"] , onlineBankingUrl: "https://www.volksbank-hochrhein.de/services_cloud/portal" },
  { id: "raiffeisenbank-wangen-eg", name: "Raiffeisenbank Wangen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069685", keywords: ["wangen"] },
  { id: "genossenschaftsbank-weil-im-schoenbuch-e", name: "Genossenschaftsbank Weil im Schönbuch eG", group: "Volksbanken Raiffeisenbanken", blz: "60069224", keywords: ["weil im schönbuch"] },
  { id: "vr-bank-schwaebischer-wald-eg", name: "VR Bank Schwäbischer Wald eG", group: "Volksbanken Raiffeisenbanken", blz: "61391410", keywords: ["welzheim"] , onlineBankingUrl: "https://www.vrbsw.de/services_cloud/portal" },
  { id: "raiffeisenbank-westhausen-eg", name: "Raiffeisenbank Westhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "60069544", keywords: ["westhausen"] , onlineBankingUrl: "https://www.raiba-westhausen.de/services_cloud/portal" },
  { id: "raiffeisenbank-baiertal-eg", name: "Raiffeisenbank Baiertal eG", group: "Volksbanken Raiffeisenbanken", blz: "67262243", keywords: ["wiesloch"] , onlineBankingUrl: "https://www.rbbai.de/services_cloud/portal" },
  { id: "volksbank-kraichgau-eg", name: "Volksbank Kraichgau eG", group: "Volksbanken Raiffeisenbanken", blz: "67292200", keywords: ["wiesloch"] , onlineBankingUrl: "https://www.vbkraichgau.de/services_cloud/portal" },
  { id: "winterbacher-bank-eg", name: "Winterbacher Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "60069462", keywords: ["winterbach"] , onlineBankingUrl: "https://www.winterbacher-bank.de/services_cloud/portal" },
  { id: "volksbank-mittlerer-schwarzwald-eg", name: "Volksbank Mittlerer Schwarzwald eG", group: "Volksbanken Raiffeisenbanken", blz: "66492700", keywords: ["wolfach"] , onlineBankingUrl: "https://www.voba-msw.de/services_cloud/portal" },
  { id: "volksbank-klettgau-wutoeschingen-eg", name: "Volksbank Klettgau-Wutöschingen eG", group: "Volksbanken Raiffeisenbanken", blz: "68462427", keywords: ["wutöschingen"] , onlineBankingUrl: "https://www.voba-kw.de/services_cloud/portal" },
  { id: "raiffeisenbank-wyhl-eg", name: "Raiffeisenbank Wyhl eG", group: "Volksbanken Raiffeisenbanken", blz: "68062730", keywords: ["wyhl am kaiserstuhl"], onlineBankingUrl: "https://www.raiffeisenbank-wyhl.de/services_cloud/portal" },
  { id: "raiffeisenbank-aitrang-ruderatshofen-eg", name: "Raiffeisenbank Aitrang-Ruderatshofen eG", group: "Volksbanken Raiffeisenbanken", blz: "73369851", keywords: ["aitrang"] , onlineBankingUrl: "https://www.raiba-aitrang-rud.de/services_cloud/portal" },
  { id: "raiffeisenbank-anger-eg", name: "Raiffeisenbank Anger eG", group: "Volksbanken Raiffeisenbanken", blz: "71062802", keywords: ["anger"] , onlineBankingUrl: "https://www.rb-anger.de/services_cloud/portal" },
  { id: "vr-bank-mittelfranken-mitte-eg", name: "VR-Bank Mittelfranken Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "76560060", keywords: ["ansbach"] , onlineBankingUrl: "https://www.vr-mfr.de/services_cloud/portal" },
  { id: "raiffeisenbank-arnstorf-eg", name: "Raiffeisenbank Arnstorf eG", group: "Volksbanken Raiffeisenbanken", blz: "74361211", keywords: ["arnstorf"] , onlineBankingUrl: "https://www.rb-arnstorf.de/services_cloud/portal" },
  { id: "raiffeisenbank-aschau-samerberg-eg", name: "Raiffeisenbank Aschau-Samerberg eG", group: "Volksbanken Raiffeisenbanken", blz: "71162804", keywords: ["aschau im chiemgau"], onlineBankingUrl: "https://www.rb-as.de/services_cloud/portal" },
  { id: "raiffeisenbank-auerbach-freihung-eg", name: "Raiffeisenbank Auerbach-Freihung eG", group: "Volksbanken Raiffeisenbanken", blz: "76069369", keywords: ["auerbach in der oberpfalz"], onlineBankingUrl: "https://www.vr-ebanking.de/index.php?RZBK=0765" },
  { id: "vr-bank-augsburg-ostallgaeu-eg", name: "VR Bank Augsburg-Ostallgäu eG", group: "Volksbanken Raiffeisenbanken", blz: "72090000", keywords: ["augsburg"] , onlineBankingUrl: "https://www.vrbank-augsburg-ostallgaeu.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-bad-kissingen-e", name: "Volksbank Raiffeisenbank Bad Kissingen eG", group: "Volksbanken Raiffeisenbanken", blz: "79065028", keywords: ["bad kissingen"] },
  { id: "raiffeisenbank-bad-koetzting-eg", name: "Raiffeisenbank Bad Kötzting eG", group: "Volksbanken Raiffeisenbanken", blz: "75069081", keywords: ["bad kötzting"], onlineBankingUrl: "https://www.rb-koetzting.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-oberbayern-sued", name: "Volksbank Raiffeisenbank Oberbayern Südost eG", group: "Volksbanken Raiffeisenbanken", blz: "71090000", keywords: ["bad reichenhall"] },
  { id: "volksbank-raiffeisenbank-obermain-eg", name: "Volksbank Raiffeisenbank Obermain eG", group: "Volksbanken Raiffeisenbanken", blz: "77062139", keywords: ["bad staffelstein"], onlineBankingUrl: "https://www.vro.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-oberland-eg", name: "Raiffeisenbank im Oberland eG", group: "Volksbanken Raiffeisenbanken", blz: "70169598", keywords: ["bad tölz"], onlineBankingUrl: "https://www.oberlandbank.de/services_cloud/portal" },
  { id: "raiffeisenbank-bad-windsheim-eg", name: "Raiffeisenbank Bad Windsheim eG", group: "Volksbanken Raiffeisenbanken", blz: "76069372", keywords: ["bad windsheim"] },
  { id: "vr-bank-bamberg-forchheim-eg", name: "VR Bank Bamberg-Forchheim eG", group: "Volksbanken Raiffeisenbanken", blz: "76391000", keywords: ["bamberg"] , onlineBankingUrl: "https://www.vrbank-bamberg-forchheim.de/services_cloud/portal" },
  { id: "vr-bank-bayreuth-hof-eg", name: "VR Bank Bayreuth-Hof eG", group: "Volksbanken Raiffeisenbanken", blz: "78060896", keywords: ["bayreuth"] , onlineBankingUrl: "https://www.vrbank-bayreuth-hof.de/services_cloud/portal" },
  { id: "raiffeisenbank-bechhofen-eg", name: "Raiffeisenbank Bechhofen eG", group: "Volksbanken Raiffeisenbanken", blz: "76069378", keywords: ["bechhofen"] , onlineBankingUrl: "https://www.rb-bechhofen.de/services_cloud/portal" },
  { id: "raiffeisenbank-plankstetten", name: "Raiffeisenbank Plankstetten", group: "Volksbanken Raiffeisenbanken", blz: "76069576", keywords: ["berching"] , onlineBankingUrl: "https://www.onlinebanking-rb-plankstetten.de/services_cloud/portal" },
  { id: "raiffeisenbank-bidingen-eg", name: "Raiffeisenbank Bidingen eG", group: "Volksbanken Raiffeisenbanken", blz: "73369859", keywords: ["bidingen"] , onlineBankingUrl: "https://www.raiba-bidingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-bobingen-eg", name: "Raiffeisenbank Bobingen eG", group: "Volksbanken Raiffeisenbanken", blz: "72069036", keywords: ["bobingen"] , onlineBankingUrl: "https://www.raiba-bobingen.de/services_cloud/portal" },
  { id: "alxing-brucker-genossenschaftsbank-eg", name: "Alxing-Brucker Genossenschaftsbank eG", group: "Volksbanken Raiffeisenbanken", blz: "70169310", keywords: ["bruck (oberbayern)"], onlineBankingUrl: "https://www.alxinger-bank.de/services_auth/auth-frontend/?v=f19e7398710bc402ce5e44a199f54700&client_id=fkp&redirect_uri=https://www.alxinger-bank.de/services_cloud/portal/portal-oauth/login", logo: "alxing-brucker-logo", hideNameInHeader: true },
  { id: "raiffeisenbank-buetthard-gaukoenigshofen", name: "Raiffeisenbank Bütthard-Gaukönigshofen eG", group: "Volksbanken Raiffeisenbanken", blz: "79069031", keywords: ["bütthard"] , onlineBankingUrl: "https://www.raiba-buett-gauk.de/services_cloud/portal" },
  { id: "raiffeisenbank-burgebrach-stegaurach-eg", name: "Raiffeisenbank Burgebrach-Stegaurach eG", group: "Volksbanken Raiffeisenbanken", blz: "77062014", keywords: ["burgebrach"] , onlineBankingUrl: "https://www.raiffeisenbank-bs.de/services_cloud/portal" },
  { id: "raiffeisenbank-oberferrieden-burgthann-e", name: "Raiffeisenbank Oberferrieden-Burgthann eG", group: "Volksbanken Raiffeisenbanken", blz: "76069564", keywords: ["burgthann"] , onlineBankingUrl: "https://www.raiba-burgthann.de/services_cloud/portal" },
  { id: "raiffeisenbank-unteres-zusamtal-eg", name: "Raiffeisenbank Unteres Zusamtal eG", group: "Volksbanken Raiffeisenbanken", blz: "72069179", keywords: ["buttenwiesen"] , onlineBankingUrl: "https://www.rb-uz.de/services_cloud/portal" },
  { id: "raiffeisenbank-chamer-land-eg", name: "Raiffeisenbank Chamer Land eG", group: "Volksbanken Raiffeisenbanken", blz: "74261024", keywords: ["cham"] , onlineBankingUrl: "https://www.rb-chamer-land.de/services_cloud/portal" },
  { id: "vr-bank-coburg-eg", name: "VR-Bank Coburg eG", group: "Volksbanken Raiffeisenbanken", blz: "78360000", keywords: ["coburg"] , onlineBankingUrl: "https://www.vrbank-coburg.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-dachau-eg", name: "Volksbank Raiffeisenbank Dachau eG", group: "Volksbanken Raiffeisenbanken", blz: "70091500", keywords: ["dachau"] , onlineBankingUrl: "https://www.vr-dachau.de/services_cloud/portal" },
  { id: "raiffeisenbank-uehlfeld-dachsbach-eg", name: "Raiffeisenbank Uehlfeld-Dachsbach eG", group: "Volksbanken Raiffeisenbanken", blz: "76069404", keywords: ["dachsbach"] , onlineBankingUrl: "https://www.raiba-ueda.de/services_cloud/portal" },
  { id: "raiffeisenbank-eg-deggendorf-plattling-s", name: "Raiffeisenbank eG Deggendorf-Plattling-Sonnenwald", group: "Volksbanken Raiffeisenbanken", blz: "74160025", keywords: ["deggendorf"] , onlineBankingUrl: "https://www.rb-deggendorf.de/services_cloud/portal" },
  { id: "raiffeisenbank-dietersheim-und-umgebung-", name: "Raiffeisenbank Dietersheim und Umgebung eG", group: "Volksbanken Raiffeisenbanken", blz: "76069410", keywords: ["dietersheim"] , onlineBankingUrl: "https://www.rb-dietersheim.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-allgaeuer-land-eg", name: "Raiffeisenbank im Allgäuer Land eG", group: "Volksbanken Raiffeisenbanken", blz: "73369264", keywords: ["dietmannsried"] , onlineBankingUrl: "https://www.rb-allgaeuerland.de/services_cloud/portal" },
  { id: "vr-bank-donau-mindel-eg", name: "VR-Bank Donau-Mindel eG", group: "Volksbanken Raiffeisenbanken", blz: "72069043", keywords: ["dillingen an der donau"] },
  { id: "raiffeisenbank-oberpfalz-sued-eg", name: "Raiffeisenbank Oberpfalz Süd eG", group: "Volksbanken Raiffeisenbanken", blz: "75062026", keywords: ["donaustauf"] , onlineBankingUrl: "https://www.rb-os.de/services_cloud/portal" },
  { id: "raiffeisen-volksbank-donauwoerth-eg", name: "Raiffeisen-Volksbank Donauwörth eG", group: "Volksbanken Raiffeisenbanken", blz: "72290100", keywords: ["donauwörth"] , onlineBankingUrl: "https://www.rvb-donauwoerth.de/services_cloud/portal" },
  { id: "raiffeisenbank-buch-eching-eg", name: "Raiffeisenbank Buch-Eching eG", group: "Volksbanken Raiffeisenbanken", blz: "74369662", keywords: ["eching"] },
  { id: "vr-bank-rottal-inn-eg", name: "VR-Bank Rottal-Inn eG", group: "Volksbanken Raiffeisenbanken", blz: "74061813", keywords: ["eggenfelden"] , onlineBankingUrl: "https://www.vrbk.de/services_cloud/portal" },
  { id: "raiffeisenbank-baisweil-eggenthal-friese", name: "Raiffeisenbank Baisweil-Eggenthal-Friesenried eG", group: "Volksbanken Raiffeisenbanken", blz: "73369871", keywords: ["eggenthal"] , onlineBankingUrl: "https://www.rb-eggenthal.de/services_cloud/portal" },
  { id: "raiffeisenbank-lech-donau-eg", name: "Raiffeisenbank Lech-Donau eG", group: "Volksbanken Raiffeisenbanken", blz: "72069005", keywords: ["ehekirchen"] , onlineBankingUrl: "https://www.raiba-aindling.de/services_cloud/portal" },
  { id: "vr-bank-erding-eg", name: "VR-Bank Erding eG", group: "Volksbanken Raiffeisenbanken", blz: "70169605", keywords: ["erding"] , onlineBankingUrl: "https://www.vr-bank-erding.de/services_cloud/portal" },
  { id: "raiffeisenbank-landshuter-land-eg", name: "Raiffeisenbank Landshuter Land eG", group: "Volksbanken Raiffeisenbanken", blz: "74362663", keywords: ["ergolding"] , onlineBankingUrl: "https://www.rb-lala.de/services_cloud/portal" },
  { id: "raiffeisenbank-elsavatal-eg", name: "Raiffeisenbank Elsavatal eG", group: "Volksbanken Raiffeisenbanken", blz: "79665540", keywords: ["eschau"] , onlineBankingUrl: "https://www.raiba-elsavatal.de/services_cloud/portal" },
  { id: "raiffeisenbank-eschlkam-lam-lohberg-neuk", name: "Raiffeisenbank Eschlkam-Lam-Lohberg-Neukirchen b.Hl.Blut eG", group: "Volksbanken Raiffeisenbanken", blz: "75069110", keywords: ["eschlkam"] , onlineBankingUrl: "https://www.rb-elln.de/services_cloud/portal" },
  { id: "raiffeisenbank-beuerberg-eurasburg-eg", name: "Raiffeisenbank Beuerberg-Eurasburg eG", group: "Volksbanken Raiffeisenbanken", blz: "70169333", keywords: ["eurasburg"], onlineBankingUrl: "https://www.rb-beuerberg.de/services_cloud/portal" },
  { id: "raiffeisenbank-falkenstein-woerth-eg", name: "Raiffeisenbank Falkenstein-Wörth eG", group: "Volksbanken Raiffeisenbanken", blz: "75069038", keywords: ["falkenstein"] , onlineBankingUrl: "https://www.rbfalkenstein-woerth.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-nuernberger-land-eg", name: "Raiffeisenbank im Nürnberger Land eG", group: "Volksbanken Raiffeisenbanken", blz: "76061482", keywords: ["feucht"] , onlineBankingUrl: "https://www.rbnl.de/services_cloud/portal" },
  { id: "raiffeisenbank-floss-eg", name: "Raiffeisenbank Floß eG", group: "Volksbanken Raiffeisenbanken", blz: "75362039", keywords: ["floß"] , onlineBankingUrl: "https://www.raiba-floss.de/services_cloud/portal" },
  { id: "freisinger-bank-eg", name: "Freisinger Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "70169614", keywords: ["freising"] , onlineBankingUrl: "https://www.fs-bank.de/services_cloud/portal" },
  { id: "raiffeisenbank-lechrain-eg", name: "Raiffeisenbank Lechrain eG", group: "Volksbanken Raiffeisenbanken", blz: "70169351", keywords: ["fuchstal"] , onlineBankingUrl: "https://www.rb-lechrain.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-fuerstenfeldbru", name: "Volksbank Raiffeisenbank Fürstenfeldbruck eG", group: "Volksbanken Raiffeisenbanken", blz: "70163370", keywords: ["fürstenfeldbruck"] , onlineBankingUrl: "https://www.vrbank-ffb.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-donautal-eg", name: "Raiffeisenbank im Donautal eG", group: "Volksbanken Raiffeisenbanken", blz: "72169812", keywords: ["gaimersheim"] , onlineBankingUrl: "https://www.rb-idt.de/services_cloud/portal" },
  { id: "raiffeisenbank-geiselhoering-pfaffenberg", name: "Raiffeisenbank Geiselhöring-Pfaffenberg eG", group: "Volksbanken Raiffeisenbanken", blz: "74369088", keywords: ["geiselhöring"] , onlineBankingUrl: "https://www.rb-geiselhoering.de/services_cloud/portal" },
  { id: "raiffeisenbank-aresing-gerolsbach-eg", name: "Raiffeisenbank Aresing-Gerolsbach eG", group: "Volksbanken Raiffeisenbanken", blz: "72169080", keywords: ["gerolsbach"] , onlineBankingUrl: "https://www.rb-arge.de/services_cloud/portal" },
  { id: "vr-mainbank-eg", name: "VR-MainBank eG", group: "Volksbanken Raiffeisenbanken", blz: "79362081", keywords: ["gerolzhofen"] , onlineBankingUrl: "https://www.vr-mb.de/services_cloud/portal/" },
  { id: "vr-handels-und-gewerbebank-eg", name: "VR Handels- und Gewerbebank eG", group: "Volksbanken Raiffeisenbanken", blz: "72062152", keywords: ["gersthofen"] , onlineBankingUrl: "https://www.vrbank-hg.de/services_cloud/portal" },
  { id: "raiffeisenbank-gilching-eg", name: "Raiffeisenbank Gilching eG", group: "Volksbanken Raiffeisenbanken", blz: "70169382", keywords: ["gilching"] , onlineBankingUrl: "https://www.raiba-gilching.de/services_cloud/portal" },
  { id: "raiffeisenbank-gmund-am-tegernsee-eg", name: "Raiffeisenbank Gmund am Tegernsee eG", group: "Volksbanken Raiffeisenbanken", blz: "70169383", keywords: ["gmund am tegernsee"], onlineBankingUrl: "https://www.raiffeisenbank-gmund.de/services_auth/auth-frontend/?v=1575dd02b62c53eaac9125d1ce9bf544&client_id=fkp&redirect_uri=https://www.raiffeisenbank-gmund.de/services_cloud/portal/portal-oauth/login" },
  { id: "raiffeisen-volksbank-ebersberg-eg", name: "Raiffeisen-Volksbank Ebersberg eG", group: "Volksbanken Raiffeisenbanken", blz: "70169450", keywords: ["grafing bei münchen"], onlineBankingUrl: "https://www.rv-ebe.de/services_auth/auth-ui/?client_id=fkp&redirect_uri=https://www.rv-ebe.de/services_cloud/portal/portal-oauth/login" },
  { id: "raiffeisenbank-grainet-eg", name: "Raiffeisenbank Grainet eG", group: "Volksbanken Raiffeisenbanken", blz: "74069744", keywords: ["grainet"] },
  { id: "raiffeisenbank-altmuehl-jura-eg", name: "Raiffeisenbank Altmühl-Jura eG", group: "Volksbanken Raiffeisenbanken", blz: "76069462", keywords: ["greding"] , onlineBankingUrl: "https://www.raiba-aj.de/services_cloud/portal" },
  { id: "raiffeisenbank-haag-gars-maitenbeth-eg", name: "Raiffeisenbank Haag-Gars-Maitenbeth eG", group: "Volksbanken Raiffeisenbanken", blz: "70169388", keywords: ["haag in oberbayern"], onlineBankingUrl: "https://www.vr-ebanking.de/index.php?RZBK=2172" },
  { id: "raiffeisenbank-alteglofsheim-hagelstadt-", name: "Raiffeisenbank Alteglofsheim-Hagelstadt eG", group: "Volksbanken Raiffeisenbanken", blz: "75069055", keywords: ["hagelstadt"] , onlineBankingUrl: "https://www.rb-ah.de/services_cloud/portal" },
  { id: "raiffeisenbank-griesstaett-halfing-eg", name: "Raiffeisenbank Griesstätt-Halfing eG", group: "Volksbanken Raiffeisenbanken", blz: "70169132", keywords: ["halfing"] , onlineBankingUrl: "https://www.raiba-gh.de/services_cloud/portal" },
  { id: "raiffeisen-volksbank-hassberge-eg", name: "Raiffeisen-Volksbank Haßberge eG", group: "Volksbanken Raiffeisenbanken", blz: "79363151", keywords: ["haßfurt"] , onlineBankingUrl: "https://www.rvb-hassberge.de/services_cloud/portal" },
  { id: "raiffeisenbank-wuestenselbitz-eg", name: "Raiffeisenbank Wüstenselbitz eG", group: "Volksbanken Raiffeisenbanken", blz: "77069906", keywords: ["helmbrechts"] , onlineBankingUrl: "https://www.rb-wuestenselbitz.de/services_cloud/portal" },
  { id: "raiffeisenbank-hengersberg-schoellnach-e", name: "Raiffeisenbank Hengersberg-Schöllnach eG", group: "Volksbanken Raiffeisenbanken", blz: "74161608", keywords: ["hengersberg"] , onlineBankingUrl: "https://www.rb-hs.de/services_cloud/portal" },
  { id: "raiffeisenbank-dreifranken-eg", name: "Raiffeisenbank DreiFranken eG", group: "Volksbanken Raiffeisenbanken", blz: "76069602", keywords: ["heßdorf"] , onlineBankingUrl: "https://www.rb-dreifranken.de/banking-service/banking-brokerage/online-banking.html" },
  { id: "raiffeisen-meine-bank-eg", name: "Raiffeisen – meine Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "76069449", keywords: ["hilpoltstein"] , onlineBankingUrl: "https://www.rmbeg.de/services_cloud/portal" },
  { id: "raiffeisenbank-hiltenfingen-eg", name: "Raiffeisenbank Hiltenfingen eG", group: "Volksbanken Raiffeisenbanken", blz: "72069105", keywords: ["hiltenfingen"] , onlineBankingUrl: "https://www.onlinebanking-raiffeisenbank-hiltenfingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-hirschau-eg", name: "Raiffeisenbank Hirschau eG", group: "Volksbanken Raiffeisenbanken", blz: "76069486", keywords: ["hirschau"] , onlineBankingUrl: "https://www.rb-hirschau.de/services_cloud/portal" },
  { id: "raiffeisenbank-hoechberg-eg", name: "Raiffeisenbank Höchberg eG", group: "Volksbanken Raiffeisenbanken", blz: "79063122", keywords: ["höchberg"] , onlineBankingUrl: "https://www.raiba-hoechberg.de/services_cloud/portal" },
  { id: "raiffeisenbank-fraenkische-schweiz-eg", name: "Raiffeisenbank Fränkische Schweiz eG", group: "Volksbanken Raiffeisenbanken", blz: "77365792", keywords: ["hollfeld"] , onlineBankingUrl: "https://www.rb-frs.de/services_cloud/portal" },
  { id: "raiffeisenbank-holzkirchen-otterfing-eg", name: "Raiffeisenbank Holzkirchen-Otterfing eG", group: "Volksbanken Raiffeisenbanken", blz: "70169410", keywords: ["holzkirchen"] , onlineBankingUrl: "https://www.rb-holzkirchen-otterfing.de/services_cloud/portal" },
  { id: "raiffeisenbank-singoldtal-eg", name: "Raiffeisenbank Singoldtal eG", group: "Volksbanken Raiffeisenbanken", blz: "70169413", keywords: ["hurlach"] , onlineBankingUrl: "https://www.rb-singoldtal.de/services_cloud/portal" },
  { id: "raiffeisenbank-ichenhausen-eg", name: "Raiffeisenbank Ichenhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "72069119", keywords: ["ichenhausen"] , onlineBankingUrl: "https://www.rb-ichenhausen.de/services_cloud/portal" },
  { id: "volksbank-immenstadt-eg", name: "Volksbank Immenstadt eG", group: "Volksbanken Raiffeisenbanken", blz: "73392000", keywords: ["immenstadt im allgäu"], onlineBankingUrl: "https://www.volksbank-immenstadt.de/banking-private/entry" },
  { id: "volksbank-raiffeisenbank-bayern-mitte-eg", name: "Volksbank Raiffeisenbank Bayern Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "72160818", keywords: ["ingolstadt"] , onlineBankingUrl: "https://www.vr-bayernmitte.de/services_cloud/portal" },
  { id: "vr-bank-ismaning-hallbergmoos-neufahrn-e", name: "VR-Bank Ismaning Hallbergmoos Neufahrn eG", group: "Volksbanken Raiffeisenbanken", blz: "70093400", keywords: ["ismaning"] , onlineBankingUrl: "https://www.vrbank-ihn.de/services_cloud/portal" },
  { id: "raiffeisenbank-kreis-kelheim-eg", name: "Raiffeisenbank Kreis Kelheim eG", group: "Volksbanken Raiffeisenbanken", blz: "75069014", keywords: ["kelheim"] , onlineBankingUrl: "https://www.rbkk.de/services_cloud/portal" },
  { id: "raiffeisenbank-oberpfalz-nordwest-eg", name: "Raiffeisenbank Oberpfalz NordWest eG", group: "Volksbanken Raiffeisenbanken", blz: "77069764", keywords: ["kemnath"] , onlineBankingUrl: "https://www.rb-onw.de/services_cloud/portal" },
  { id: "vr-bank-kempten-oberallgaeu-eg", name: "VR Bank Kempten-Oberallgäu eG", group: "Volksbanken Raiffeisenbanken", blz: "73369920", keywords: ["kempten (allgäu)"], onlineBankingUrl: "https://www.vrbank-ke-oa.de/services_cloud/portal" },
  { id: "vr-bank-kitzingen-eg", name: "VR Bank Kitzingen eG", group: "Volksbanken Raiffeisenbanken", blz: "79190000", keywords: ["kitzingen"], onlineBankingUrl: "https://www.vrkt.de/services_cloud/portal" },
  { id: "raiffeisenbank-schwaben-mitte-eg", name: "Raiffeisenbank Schwaben Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "72069736", keywords: ["krumbach (schwaben)"] },
  { id: "raiffeisenbank-kueps-mitwitz-stockheim-e", name: "Raiffeisenbank Küps-Mitwitz-Stockheim eG", group: "Volksbanken Raiffeisenbanken", blz: "77069044", keywords: ["küps"] , onlineBankingUrl: "https://www.raiba-kms.de/services_cloud/portal" },
  { id: "vr-bank-oberfranken-mitte-eg", name: "VR Bank Oberfranken Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "77190000", keywords: ["kulmbach"] , onlineBankingUrl: "https://www.vr-ofrm.de/services_cloud/portal" },
  { id: "vr-bank-landau-mengkofen-eg", name: "VR-Bank Landau-Mengkofen eG", group: "Volksbanken Raiffeisenbanken", blz: "74191000", keywords: ["landau an der isar"], onlineBankingUrl: "https://www.vrbanklm.de/services_cloud/portal" },
  { id: "vr-bank-landsberg-ammersee-eg", name: "VR-Bank Landsberg-Ammersee eG", group: "Volksbanken Raiffeisenbanken", blz: "70091600", keywords: ["landsberg am lech"], onlineBankingUrl: "https://www.vr-ll.de/banking-private/entry?trackid=piwik1456e51881a11b86" },
  { id: "vr-bank-landshut-eg", name: "VR-Bank Landshut eG", group: "Volksbanken Raiffeisenbanken", blz: "74390000", keywords: ["landshut"] , onlineBankingUrl: "https://www.vrla.de/services_cloud/portal" },
  { id: "raiffeisenbank-schrobenhausener-land-eg", name: "Raiffeisenbank Schrobenhausener Land eG", group: "Volksbanken Raiffeisenbanken", blz: "72169246", keywords: ["langenmosen"] , onlineBankingUrl: "https://www.rb-sobland.de/services_cloud/portal" },
  { id: "raiffeisen-spar-kreditbank-eg", name: "Raiffeisen Spar + Kreditbank eG", group: "Volksbanken Raiffeisenbanken", blz: "76061025", keywords: ["lauf an der pegnitz"] },
  { id: "vr-bank-lichtenfels-ebern-eg", name: "VR-Bank Lichtenfels-Ebern eG", group: "Volksbanken Raiffeisenbanken", blz: "77091800", keywords: ["lichtenfels"] , onlineBankingUrl: "https://www.vr-lif-ebn.de/services_cloud/portal" },
  { id: "vr-suedbank-eg", name: "VR SüdBank eG", group: "Volksbanken Raiffeisenbanken", blz: "73369821", keywords: ["lindau (bodensee)"] },
  { id: "volksbank-lindenberg-eg", name: "Volksbank Lindenberg eG", group: "Volksbanken Raiffeisenbanken", blz: "73369826", keywords: ["lindenberg im allgäu"], onlineBankingUrl: "https://www.volksbank-lindenberg.de/" },
  { id: "raiffeisenbank-main-spessart-eg", name: "Raiffeisenbank Main-Spessart eG", group: "Volksbanken Raiffeisenbanken", blz: "79069150", keywords: ["lohr am main"], onlineBankingUrl: "https://www.raiba-msp.de/services_cloud/portal" },
  { id: "raiffeisenbank-hallertau-eg", name: "Raiffeisenbank Hallertau eG", group: "Volksbanken Raiffeisenbanken", blz: "70169693", keywords: ["mainburg"] , onlineBankingUrl: "https://www.raibahallertau.de/services_cloud/portal" },
  { id: "raiffeisenbank-oberland-eg", name: "Raiffeisenbank Oberland eG", group: "Volksbanken Raiffeisenbanken", blz: "77069868", keywords: ["marktleugast"] , onlineBankingUrl: "https://www.raiba-oberland.de/services_cloud/portal" },
  { id: "vr-bank-fichtelgebirge-frankenwald-eg", name: "VR-Bank Fichtelgebirge-Frankenwald eG", group: "Volksbanken Raiffeisenbanken", blz: "78160069", keywords: ["marktredwitz"] , onlineBankingUrl: "https://www.vr-ff.de/services_cloud/portal" },
  { id: "vr-bank-memmingen-eg", name: "VR-Bank Memmingen eG", group: "Volksbanken Raiffeisenbanken", blz: "73190000", keywords: ["memmingen"] , onlineBankingUrl: "https://www.vr-memmingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-wittelsbacher-land-eg", name: "Raiffeisenbank Wittelsbacher Land eG", group: "Volksbanken Raiffeisenbanken", blz: "72069155", keywords: ["mering"] , onlineBankingUrl: "https://www.rb-wila.de/services_cloud/portal" },
  { id: "genossenschaftsbank-unterallgaeu-eg", name: "Genossenschaftsbank Unterallgäu eG", group: "Volksbanken Raiffeisenbanken", blz: "73160000", keywords: ["mindelheim"] , onlineBankingUrl: "https://www.genobank-unterallgaeu.de/services_cloud/portal" },
  { id: "raiffeisenbank-mittenwald-eg", name: "Raiffeisenbank Mittenwald eG", group: "Volksbanken Raiffeisenbanken", blz: "70169459", keywords: ["mittenwald"] , onlineBankingUrl: "https://www.raiba-mittenwald.de/services_cloud/portal" },
  { id: "raiffeisenbank-westkreis-fuerstenfeldbru", name: "Raiffeisenbank Westkreis Fürstenfeldbruck eG", group: "Volksbanken Raiffeisenbanken", blz: "70169460", keywords: ["moorenweis"] , onlineBankingUrl: "https://www.westkreis.de/services_cloud/portal" },
  { id: "genossenschaftsbank-eg-muenchen", name: "Genossenschaftsbank eG München", group: "Volksbanken Raiffeisenbanken", blz: "70169464", keywords: ["münchen"] , onlineBankingUrl: "https://www.genobamuc.de/services_cloud/portal" },
  { id: "muenchner-bank-eg", name: "Münchner Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "70190000", keywords: ["münchen"] , onlineBankingUrl: "https://www.muenchner-bank.de/services_cloud/portal" },
  { id: "raiffeisenbank-muenchen-sued-eg", name: "Raiffeisenbank München-Süd eG", group: "Volksbanken Raiffeisenbanken", blz: "70169466", keywords: ["münchen"] , onlineBankingUrl: "https://www.raiba-muc-sued.de/services_cloud/portal" },
  { id: "vr-bank-neuburg-rain-eg", name: "VR Bank Neuburg-Rain eG", group: "Volksbanken Raiffeisenbanken", blz: "72169756", keywords: ["neuburg an der donau"], onlineBankingUrl: "https://www.vr-neuburg-rain.de/services_cloud/portal" },
  { id: "raiffeisenbank-neumarkt-i-d-opf-eg", name: "Raiffeisenbank Neumarkt i.d.OPf. eG", group: "Volksbanken Raiffeisenbanken", blz: "76069553", keywords: ["neumarkt in der oberpfalz"], onlineBankingUrl: "https://www.raiba-neumarkt-opf.de/services_cloud/portal/" },
  { id: "vr-teilhaberbank-metropolregion-nuernber", name: "VR TeilhaberBank Metropolregion Nürnberg eG", group: "Volksbanken Raiffeisenbanken", blz: "76069559", keywords: ["neustadt an der aisch"], onlineBankingUrl: "https://www.vr-teilhaberbank.de/services_cloud/portal" },
  { id: "vr-bank-neu-ulm-eg", name: "VR-Bank Neu-Ulm eG", group: "Volksbanken Raiffeisenbanken", blz: "73061191", keywords: ["neu-ulm"] , onlineBankingUrl: "https://www.vrnu.de/services_cloud/portal" },
  { id: "raiffeisen-volksbank-ries-eg", name: "Raiffeisen-Volksbank Ries eG", group: "Volksbanken Raiffeisenbanken", blz: "72069329", keywords: ["nördlingen"] , onlineBankingUrl: "https://www.rvbankries.de/services_cloud/portal" },
  { id: "raiffeisenbank-knoblauchsland-bibertgrun", name: "Raiffeisenbank Knoblauchsland-Bibertgrund eG", group: "Volksbanken Raiffeisenbanken", blz: "76069669", keywords: ["nürnberg"] , onlineBankingUrl: "https://www.raiba-bibertgrund.de/services_cloud/portal" },
  { id: "raiffeisenbank-oberaudorf-eg", name: "Raiffeisenbank Oberaudorf eG", group: "Volksbanken Raiffeisenbanken", blz: "71162355", keywords: ["oberaudorf"] , onlineBankingUrl: "https://www.rb-oberaudorf.de/services_cloud/portal" },
  { id: "vr-bank-muenchen-land-eg", name: "VR Bank München Land eG", group: "Volksbanken Raiffeisenbanken", blz: "70166486", keywords: ["oberhaching"] , onlineBankingUrl: "https://www.vr-bank-muenchen-land.de/services_cloud/portal" },
  { id: "raiffeisenbank-taufkirchen-oberneukirche", name: "Raiffeisenbank Taufkirchen-Oberneukirchen eG", group: "Volksbanken Raiffeisenbanken", blz: "70169568", keywords: ["oberneukirchen"] , onlineBankingUrl: "https://www.rb-tofk.de/services_cloud/portal" },
  { id: "raiffeisenbank-pfaffenhofen-a-d-glonn-eg", name: "Raiffeisenbank Pfaffenhofen a.d. Glonn eG", group: "Volksbanken Raiffeisenbanken", blz: "70169186", keywords: ["odelzhausen"] , onlineBankingUrl: "https://www.onlinebanking-raiba-pfaffenhofen.de/services_cloud/portal" },
  { id: "raiffeisenbank-ortenburg-kirchberg-v-w-e", name: "Raiffeisenbank Ortenburg-Kirchberg v.W. eG", group: "Volksbanken Raiffeisenbanken", blz: "74061670", keywords: ["ortenburg"] , onlineBankingUrl: "https://www.rbok.de/services_cloud/portal" },
  { id: "raiffeisenbank-parkstetten-eg", name: "Raiffeisenbank Parkstetten eG", group: "Volksbanken Raiffeisenbanken", blz: "74369130", keywords: ["parkstetten"] , onlineBankingUrl: "https://www.rb-parkstetten.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-oberpfaelzer-jura-eg", name: "Raiffeisenbank im Oberpfälzer Jura eG", group: "Volksbanken Raiffeisenbanken", blz: "75069061", keywords: ["parsberg"] , onlineBankingUrl: "https://www.rb-opf-jura.de/services_cloud/portal" },
  { id: "vr-bank-passau-eg", name: "VR-Bank Passau eG", group: "Volksbanken Raiffeisenbanken", blz: "74090000", keywords: ["passau"] , onlineBankingUrl: "https://www.vr-bank-passau.de/services_cloud/portal" },
  { id: "raiffeisenbank-pfaffenwinkel-eg", name: "Raiffeisenbank Pfaffenwinkel eG", group: "Volksbanken Raiffeisenbanken", blz: "70169509", keywords: ["peiting"] , onlineBankingUrl: "https://www.raiba-pfaffenwinkel.de/services_cloud/portal" },
  { id: "raiffeisenbank-pfaffenhausen-eg", name: "Raiffeisenbank Pfaffenhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "72069789", keywords: ["pfaffenhausen"] , onlineBankingUrl: "https://www.rb-pfaffenhausen.de/services_cloud/portal" },
  { id: "raiffeisenbank-kirchweihtal-eg", name: "Raiffeisenbank Kirchweihtal eG", group: "Volksbanken Raiffeisenbanken", blz: "73369918", keywords: ["pforzen"] , onlineBankingUrl: "https://www.rb-kirchweihtal.de/services_cloud/portal" },
  { id: "raiffeisenbank-unteres-inntal-eg", name: "Raiffeisenbank Unteres Inntal eG", group: "Volksbanken Raiffeisenbanken", blz: "74061564", keywords: ["pocking"] , onlineBankingUrl: "https://www.rbui.de/services_cloud/portal" },
  { id: "vr-bank-vilshofen-pocking-eg", name: "VR-Bank Vilshofen-Pocking eG", group: "Volksbanken Raiffeisenbanken", blz: "74062490", keywords: ["pocking"] , onlineBankingUrl: "https://www.vr-vilshofen.de/services_cloud/portal" },
  { id: "raiffeisenbank-eg-9213", name: "Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "79069213", keywords: ["rannungen"] , onlineBankingUrl: "https://www.rb-massbach.de/services_cloud/portal" },
  { id: "raiffeisenbank-rattiszell-konzell-eg", name: "Raiffeisenbank Rattiszell-Konzell eG", group: "Volksbanken Raiffeisenbanken", blz: "74369146", keywords: ["rattiszell"] , onlineBankingUrl: "https://www.rb-rattiszell-konzell.de/services_cloud/portal" },
  { id: "bankhaus-rsa-eg", name: "Bankhaus RSA eG", group: "Volksbanken Raiffeisenbanken", blz: "70169524", keywords: ["rechtmehring"] , onlineBankingUrl: "https://www.bankhaus-rsa.de/services_cloud/portal" },
  { id: "raiffeisenbank-regensburg-wenzenbach-eg", name: "Raiffeisenbank Regensburg-Wenzenbach eG", group: "Volksbanken Raiffeisenbanken", blz: "75060150", keywords: ["regensburg"] , onlineBankingUrl: "https://www.raiffeisenbank-regensburg.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-regensburg-schw", name: "Volksbank Raiffeisenbank Regensburg-Schwandorf eG", group: "Volksbanken Raiffeisenbanken", blz: "75090000", keywords: ["regensburg"] , onlineBankingUrl: "https://www.volksbank-raiffeisenbank-regensburg-schwandorf.de/services_cloud/portal" },
  { id: "raiffeisenbank-regenstauf-eg", name: "Raiffeisenbank Regenstauf eG", group: "Volksbanken Raiffeisenbanken", blz: "75061851", keywords: ["regenstauf"] , onlineBankingUrl: "https://www.raiffeisenbank-regensburg.de/services_cloud/portal" },
  { id: "raiffeisenbank-rehling-eg", name: "Raiffeisenbank Rehling eG", group: "Volksbanken Raiffeisenbanken", blz: "72069193", keywords: ["rehling"] , onlineBankingUrl: "https://www.raiba-rehling.de/services_cloud/portal" },
  { id: "raiffeisenbank-neumarkt-st-veit-reischac", name: "Raiffeisenbank Neumarkt-St. Veit - Reischach eG", group: "Volksbanken Raiffeisenbanken", blz: "70169530", keywords: ["reischach"] , onlineBankingUrl: "https://www.rb-nr.de/services_cloud/portal" },
  { id: "raiffeisenbank-mittelschwaben-eg", name: "Raiffeisenbank Mittelschwaben eG", group: "Volksbanken Raiffeisenbanken", blz: "72069126", keywords: ["roggenburg"] , onlineBankingUrl: "https://www.rb-mittelschwaben.de/services_cloud/portal" },
  { id: "meine-volksbank-raiffeisenbank-eg", name: "meine Volksbank Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "71160000", keywords: ["rosenheim"] , onlineBankingUrl: "https://www.vb-rb.de/services_cloud/portal" },
  { id: "raiffeisenbank-unteres-vilstal-eg", name: "Raiffeisenbank Unteres Vilstal eG", group: "Volksbanken Raiffeisenbanken", blz: "76069611", keywords: ["schmidmühlen"] , onlineBankingUrl: "https://www.rbuv.de/services_cloud/portal" },
  { id: "schrobenhausener-bank-eg", name: "Schrobenhausener Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "72169218", keywords: ["schrobenhausen"] , onlineBankingUrl: "https://www.sob-bank.de/services_cloud/portal" },
  { id: "raiffeisenbank-schwabmuenchen-stauden-eg", name: "Raiffeisenbank Schwabmünchen-Stauden eG", group: "Volksbanken Raiffeisenbanken", blz: "72069220", keywords: ["schwabmünchen"] , onlineBankingUrl: "https://www.raiba-smue-stauden.de/services_cloud/portal" },
  { id: "vr-bank-mittlere-oberpfalz-eg", name: "VR Bank Mittlere Oberpfalz eG", group: "Volksbanken Raiffeisenbanken", blz: "75069171", keywords: ["schwandorf"] , onlineBankingUrl: "https://www.vr-mio.de/services_cloud/portal" },
  { id: "vr-bank-main-rhoen-eg", name: "VR-Bank Main-Rhön eG", group: "Volksbanken Raiffeisenbanken", blz: "79069165", keywords: ["schweinfurt"] , onlineBankingUrl: "https://www.vr-bank-mr.de/services_cloud/portal" },
  { id: "raiffeisenbank-suedliches-ostallgaeu-eg", name: "Raiffeisenbank Südliches Ostallgäu eG", group: "Volksbanken Raiffeisenbanken", blz: "73369933", keywords: ["seeg"] , onlineBankingUrl: "https://www.rb-sued-oal.de/services_cloud/portal" },
  { id: "raiffeisenbank-chiemgau-nord-obing-eg", name: "Raiffeisenbank Chiemgau - Nord - Obing eG", group: "Volksbanken Raiffeisenbanken", blz: "70169165", keywords: ["seeon-seebruck"] , onlineBankingUrl: "https://www.rb-chiemgau-nord.de/services_cloud/portal" },
  { id: "raiffeisenbank-sinzing-eg", name: "Raiffeisenbank Sinzing eG", group: "Volksbanken Raiffeisenbanken", blz: "75069078", keywords: ["sinzing"] , onlineBankingUrl: "https://www.raiffeisenbank-sinzing.de/services_cloud/portal" },
  { id: "raiffeisenbank-am-kulm-eg", name: "Raiffeisenbank am Kulm eG", group: "Volksbanken Raiffeisenbanken", blz: "77069782", keywords: ["speichersdorf"] , onlineBankingUrl: "https://www.rb-am-kulm.de/services_cloud/portal" },
  { id: "raiffeisenbank-hochfranken-west-eg", name: "Raiffeisenbank Hochfranken West eG", group: "Volksbanken Raiffeisenbanken", blz: "77069870", keywords: ["stammbach"] , onlineBankingUrl: "https://www.rb-hfw.de/services_cloud/portal" },
  { id: "vr-bank-starnberg-zugspitze-eg", name: "VR Bank Starnberg-Zugspitze eG", group: "Volksbanken Raiffeisenbanken", blz: "70093200", keywords: ["starnberg"] , onlineBankingUrl: "https://www.vrsta.de/services_cloud/portal" },
  { id: "raiffeisenbank-steingaden-eg", name: "Raiffeisenbank Steingaden eG", group: "Volksbanken Raiffeisenbanken", blz: "70169558", keywords: ["steingaden"] , onlineBankingUrl: "https://www.raiba-steingaden.de/services_cloud/portal" },
  { id: "raiffeisenbank-straubing-eg", name: "Raiffeisenbank Straubing eG", group: "Volksbanken Raiffeisenbanken", blz: "74260110", keywords: ["straubing"] , onlineBankingUrl: "https://www.raiffeisenbank-straubing.de/services_cloud/portal" },
  { id: "vr-bank-ostbayern-mitte-eg", name: "VR-Bank Ostbayern-Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "74290000", keywords: ["straubing"] , onlineBankingUrl: "https://www.vr-obm.de/services_cloud/portal" },
  { id: "vr-bank-amberg-sulzbach-eg", name: "VR Bank Amberg-Sulzbach eG", group: "Volksbanken Raiffeisenbanken", blz: "75290000", keywords: ["sulzbach-rosenberg"] , onlineBankingUrl: "https://www.vr-as.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-grabfeld-eg", name: "Raiffeisenbank im Grabfeld eG", group: "Volksbanken Raiffeisenbanken", blz: "79069188", keywords: ["sulzdorf an der lederhecke"], onlineBankingUrl: "https://finanzportal.fiducia.de/entry?appid=ebpe&bankid=XC0313" },
  { id: "vr-bank-taufkirchen-dorfen-eg", name: "VR-Bank Taufkirchen-Dorfen eG", group: "Volksbanken Raiffeisenbanken", blz: "70169566", keywords: ["taufkirchen (vils)"], onlineBankingUrl: "https://www.vr-bank-online.de/services_cloud/portal" },
  { id: "raiffeisenbank-rupertiwinkel-eg", name: "Raiffeisenbank Rupertiwinkel eG", group: "Volksbanken Raiffeisenbanken", blz: "70169191", keywords: ["teisendorf"] , onlineBankingUrl: "https://www.raiba-rupertiwinkel.de/services_cloud/portal" },
  { id: "raiffeisenbank-thannhausen-eg", name: "Raiffeisenbank Thannhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "72069235", keywords: ["thannhausen (schwaben)"], onlineBankingUrl: "https://www.rb-thannhausen.de/services_cloud/portal" },
  { id: "raiffeisenbank-i-lkrs-passau-nord-eg", name: "Raiffeisenbank i. Lkrs. Passau-Nord eG", group: "Volksbanken Raiffeisenbanken", blz: "74062786", keywords: ["tiefenbach"] , onlineBankingUrl: "https://www.rbpn.de/services_cloud/portal" },
  { id: "raiffeisenbank-tuerkheim-eg", name: "Raiffeisenbank Türkheim eG", group: "Volksbanken Raiffeisenbanken", blz: "70169575", keywords: ["türkheim"] , onlineBankingUrl: "https://www.rb-tuerkheim.de/services_cloud/portal" },
  { id: "raiffeisen-volksbank-tuessling-unterneuk", name: "Raiffeisen-Volksbank Tüßling-Unterneukirchen eG", group: "Volksbanken Raiffeisenbanken", blz: "70169576", keywords: ["tüßling"] , onlineBankingUrl: "https://www.rv-banken.de/services_cloud/portal" },
  { id: "raiffeisenbank-muenchen-nord-eg", name: "Raiffeisenbank München-Nord eG", group: "Volksbanken Raiffeisenbanken", blz: "70169465", keywords: ["unterschleißheim"] , onlineBankingUrl: "https://www.banking-rb-mnord.de/services_cloud/portal" },
  { id: "vr-genobank-donauwald-eg", name: "VR GenoBank DonauWald eG", group: "Volksbanken Raiffeisenbanken", blz: "74190000", keywords: ["viechtach"] , onlineBankingUrl: "https://www.vr-genobank.de/services_cloud/portal" },
  { id: "vr-bank-isar-vils-eg", name: "VR-Bank Isar-Vils eG", group: "Volksbanken Raiffeisenbanken", blz: "74392300", keywords: ["vilsbiburg"] , onlineBankingUrl: "https://www.vrbank-isar-vils.de/services_cloud/portal" },
  { id: "raiffeisenbank-mainschleife-steigerwald-", name: "Raiffeisenbank Mainschleife-Steigerwald eG", group: "Volksbanken Raiffeisenbanken", blz: "79069001", keywords: ["volkach"] , onlineBankingUrl: "https://www.raiffeisenbank-mainschleife-steigerwald.de/services_cloud/portal" },
  { id: "raiffeisenbank-wald-goerisried-eg", name: "Raiffeisenbank Wald-Görisried eG", group: "Volksbanken Raiffeisenbanken", blz: "73369954", keywords: ["wald"], onlineBankingUrl: "https://www.rb-wald.de/services_cloud/portal" },
  { id: "raiffeisenbank-goldener-steig-dreisessel", name: "Raiffeisenbank Goldener Steig - Dreisessel eG", group: "Volksbanken Raiffeisenbanken", blz: "74061101", keywords: ["waldkirchen"] , onlineBankingUrl: "https://www.rb-ags.de/services_cloud/portal" },
  { id: "raiffeisenbank-wallgau-kruen-eg", name: "Raiffeisenbank Wallgau-Krün eG", group: "Volksbanken Raiffeisenbanken", blz: "70362595", keywords: ["wallgau"] , onlineBankingUrl: "https://www.raiba-wallgau-kruen.de/services_cloud/portal" },
  { id: "raiffeisenbank-wegscheid-eg", name: "Raiffeisenbank Wegscheid eG", group: "Volksbanken Raiffeisenbanken", blz: "74064593", keywords: ["wegscheid"] , onlineBankingUrl: "https://www.rb-wegscheid.de/services_cloud/portal" },
  { id: "volksbank-raiffeisenbank-nordoberpfalz-e", name: "Volksbank Raiffeisenbank Nordoberpfalz eG", group: "Volksbanken Raiffeisenbanken", blz: "75390000", keywords: ["weiden in der oberpfalz"], onlineBankingUrl: "https://www.vr-nordoberpfalz.de/banking-private/entry" },
  { id: "vr-bank-im-suedlichen-franken-eg", name: "VR Bank im südlichen Franken eG", group: "Volksbanken Raiffeisenbanken", blz: "76591000", keywords: ["weißenburg in bayern"], onlineBankingUrl: "https://www.vr-sf.de/services_cloud/portal" },
  { id: "raiffeisenbank-isar-loisachtal-eg", name: "Raiffeisenbank Isar-Loisachtal eG", group: "Volksbanken Raiffeisenbanken", blz: "70169543", keywords: ["wolfratshausen"] , onlineBankingUrl: "https://www.rileg.de/startseite.html" },
  { id: "volksbank-raiffeisenbank-wuerzburg-eg", name: "Volksbank Raiffeisenbank Würzburg eG", group: "Volksbanken Raiffeisenbanken", blz: "79090000", keywords: ["würzburg"] , onlineBankingUrl: "https://www.vr-bank-wuerzburg.de/services_cloud/portal" },
  { id: "raiffeisenbank-augsburger-land-west-eg", name: "Raiffeisenbank Augsburger Land West eG", group: "Volksbanken Raiffeisenbanken", blz: "72069274", keywords: ["zusmarshausen"] , onlineBankingUrl: "https://www.rb-alw.de/services_cloud/portal" },
  { id: "berliner-volksbank-eg", name: "Berliner Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "10090000", keywords: ["berlin"] , onlineBankingUrl: "https://www.berliner-volksbank.de/services_cloud/portal" },
  { id: "raiffeisen-volksbank-oder-spree-eg", name: "Raiffeisen-Volksbank Oder-Spree eG", group: "Volksbanken Raiffeisenbanken", blz: "17062428", keywords: ["beeskow"] , onlineBankingUrl: "https://www.rvboderspree.de/services_cloud/portal" },
  { id: "brandenburger-bank-volksbank-raiffeisenb", name: "Brandenburger Bank Volksbank-Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "16062073", keywords: ["brandenburg an der havel"], onlineBankingUrl: "https://www.brandenburgerbank.de/ptlweb/WebPortal?bankid=2840" },
  { id: "vr-bank-lausitz-eg", name: "VR Bank Lausitz eG", group: "Volksbanken Raiffeisenbanken", blz: "18062678", keywords: ["cottbus"] , onlineBankingUrl: "https://www.vrblausitz.de/services_cloud/portal" },
  { id: "volks-und-raiffeisenbank-fuerstenwalde-s", name: "Volks- und Raiffeisenbank Fürstenwalde Seelow Wriezen eG", group: "Volksbanken Raiffeisenbanken", blz: "17092404", keywords: ["fürstenwalde/spree"] , onlineBankingUrl: "https://www.vrbfw.de/services_cloud/portal" },
  { id: "vr-bank-flaeming-elsterland-eg", name: "VR-Bank Fläming-Elsterland eG", group: "Volksbanken Raiffeisenbanken", blz: "16062008", keywords: ["luckenwalde"] , onlineBankingUrl: "https://www.vr-internet.de/services_cloud/portal" },
  { id: "spreewaldbank-eg", name: "Spreewaldbank eG", group: "Volksbanken Raiffeisenbanken", blz: "18092684", keywords: ["lübben"] , onlineBankingUrl: "https://www.spreewaldbank.de/services_cloud/portal" },
  { id: "raiffeisenbank-ostprignitz-ruppin-eg", name: "Raiffeisenbank Ostprignitz-Ruppin eG", group: "Volksbanken Raiffeisenbanken", blz: "16061938", keywords: ["neuruppin"] , onlineBankingUrl: "https://www.rbopr.de/services_cloud/portal" },
  { id: "volks-und-raiffeisenbank-prignitz-eg", name: "Volks- und Raiffeisenbank Prignitz eG", group: "Volksbanken Raiffeisenbanken", blz: "16060122", keywords: ["perleberg"] , onlineBankingUrl: "https://www.vrbprignitz.de/services_cloud/portal" },
  { id: "vr-bank-uckermark-randow-eg", name: "VR-Bank Uckermark-Randow eG", group: "Volksbanken Raiffeisenbanken", blz: "15091704", keywords: ["prenzlau"] , onlineBankingUrl: "https://www.vrb-uckermark-randow.de/services_cloud/portal" },
  { id: "volksbank-rathenow-eg", name: "Volksbank Rathenow eG", group: "Volksbanken Raiffeisenbanken", blz: "16091994", keywords: ["rathenow"] , onlineBankingUrl: "https://www.vbrn.de/services_cloud/portal" },
  { id: "volksbank-spree-neisse-eg", name: "Volksbank Spree-Neiße eG", group: "Volksbanken Raiffeisenbanken", blz: "18092744", keywords: ["spremberg"] , onlineBankingUrl: "https://www.vbspn.de/services_cloud/portal" },
  { id: "bremische-volksbank-weser-wuemme-eg", name: "Bremische Volksbank Weser-Wümme eG", group: "Volksbanken Raiffeisenbanken", blz: "29190024", keywords: ["bremen"] , onlineBankingUrl: "https://www.bremischevb.de/services_cloud/portal" },
  { id: "volksbank-bremen-nord-eg", name: "Volksbank Bremen-Nord eG", group: "Volksbanken Raiffeisenbanken", blz: "29190330", keywords: ["bremen"], onlineBankingUrl: "https://www.vbbremennord.de/services_cloud/portal" },
  { id: "hamburger-volksbank-eg", name: "Hamburger Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "20190003", keywords: ["hamburg"] , onlineBankingUrl: "https://www.hamburger-volksbank.de/services_cloud/portal" },
  { id: "vr-verbundbank-eg", name: "VR VerbundBank eG", group: "Volksbanken Raiffeisenbanken", blz: "53093200", keywords: ["alsfeld"] , onlineBankingUrl: "https://www.vrbank-hessenland.de/services_cloud/portal" },
  { id: "raiffeisenbank-eg-4156", name: "Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "52064156", keywords: ["baunatal"] , onlineBankingUrl: "https://www.rb-baunatal.de/services_cloud/portal" },
  { id: "raiffeisenbank-noerdliche-bergstrasse-eg", name: "Raiffeisenbank Nördliche Bergstraße eG", group: "Volksbanken Raiffeisenbanken", blz: "50861501", keywords: ["bickenbach (bergstraße)"], onlineBankingUrl: "https://www.raiba-alsbach.de/services_auth/auth-frontend/?v=fcba3dbe65f862ec41052a24ccfc9508&client_id=fkp&redirect_uri=https://www.raiba-alsbach.de/services_cloud/portal/portal-oauth/login" },
  { id: "vr-bank-main-kinzig-buedingen-eg", name: "VR Bank Main-Kinzig-Büdingen eG", group: "Volksbanken Raiffeisenbanken", blz: "50661639", keywords: ["büdingen"] , onlineBankingUrl: "https://www.vrbank-mkb.de/services_cloud/portal" },
  { id: "vr-bank-ried-ueberwald-eg", name: "VR Bank Ried-Überwald eG", group: "Volksbanken Raiffeisenbanken", blz: "50961206", keywords: ["bürstadt"] , onlineBankingUrl: "https://www.raiba-ried.de/services_cloud/portal" },
  { id: "volksbank-butzbach-eg", name: "Volksbank Butzbach eG", group: "Volksbanken Raiffeisenbanken", blz: "51861403", keywords: ["butzbach"] , onlineBankingUrl: "https://www.volksbank-butzbach.de/services_cloud/portal" },
  { id: "vr-bank-lahn-dill-eg", name: "VR Bank Lahn-Dill eG", group: "Volksbanken Raiffeisenbanken", blz: "51762434", keywords: ["dillenburg"] , onlineBankingUrl: "https://www.vrbank-lahndill.de/services_cloud/portal" },
  { id: "volksbank-langendernbach-eg", name: "Volksbank Langendernbach eG", group: "Volksbanken Raiffeisenbanken", blz: "51161606", keywords: ["dornburg"] , onlineBankingUrl: "https://www.volksbank-langendernbach.de/services_cloud/portal" },
  { id: "vr-bank-dreieich-offenbach-eg", name: "VR Bank Dreieich - Offenbach eG", group: "Volksbanken Raiffeisenbanken", blz: "50592200", keywords: ["dreieich"] , onlineBankingUrl: "https://www.vrbanking.de/services_cloud/portal" },
  { id: "frankfurter-volksbank-eg", name: "Frankfurter Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "50190000", keywords: ["frankfurt am main"], hideNameInHeader: true, onlineBankingUrl: "https://www.frankfurter-volksbank.de/banking-private/entry" },
  { id: "vr-bank-fulda-eg", name: "VR Bank Fulda eG", group: "Volksbanken Raiffeisenbanken", blz: "53060180", keywords: ["fulda"] , onlineBankingUrl: "https://www.vrbankfulda.de/services_cloud/portal" },
  { id: "rheingauer-volksbank-eg", name: "Rheingauer Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "51091500", keywords: ["geisenheim"] , onlineBankingUrl: "https://www.rheingauer-volksbank.de/services_cloud/portal" },
  { id: "vr-bank-bad-orb-gelnhausen-eg", name: "VR Bank Bad Orb-Gelnhausen eG", group: "Volksbanken Raiffeisenbanken", blz: "50790000", keywords: ["gelnhausen"] , onlineBankingUrl: "https://www.vbrb.de/services_cloud/portal" },
  { id: "spar-u-kredit-bank-eg", name: "Spar-u.Kredit-Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "52069029", keywords: ["gemünden (wohra)"] },
  { id: "volksbank-mittelhessen-eg", name: "Volksbank Mittelhessen eG", group: "Volksbanken Raiffeisenbanken", blz: "51390000", keywords: ["gießen"] , onlineBankingUrl: "https://www.vb-mittelhessen.de/services_cloud/portal" },
  { id: "volksbank-mainspitze-eg", name: "Volksbank Mainspitze eG", group: "Volksbanken Raiffeisenbanken", blz: "50862903", keywords: ["ginsheim-gustavsburg"] , onlineBankingUrl: "https://www.voba-mainspitze.de/services_cloud/portal" },
  { id: "raiffeisenbank-graevenwiesbach-eg", name: "Raiffeisenbank Grävenwiesbach eG", group: "Volksbanken Raiffeisenbanken", blz: "50069345", keywords: ["grävenwiesbach"] , onlineBankingUrl: "https://www.rb-graevenwiesbach.de/services_cloud/portal" },
  { id: "volksbank-eg-9146", name: "Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "50069146", keywords: ["grebenhain"] , onlineBankingUrl: "https://www.vb-grebenhain.de/services_cloud/portal" },
  { id: "raiffeisenbank-im-fuldaer-land-eg", name: "Raiffeisenbank im Fuldaer Land eG", group: "Volksbanken Raiffeisenbanken", blz: "53062035", keywords: ["großenlüder"] , onlineBankingUrl: "https://www.rb-fuldaerland.de/services_cloud/portal" },
  { id: "raiffeisenbank-werratal-landeck-eg", name: "Raiffeisenbank Werratal-Landeck eG", group: "Volksbanken Raiffeisenbanken", blz: "53261342", keywords: ["heringen (werra)"], onlineBankingUrl: "https://www.rb-wl.de/banking-und-vertraege/banking/banking-privatkunden/onlinebanking.html" },
  { id: "volksbank-heuchelheim-eg", name: "Volksbank Heuchelheim eG", group: "Volksbanken Raiffeisenbanken", blz: "51361021", keywords: ["heuchelheim an der lahn"], onlineBankingUrl: "https://www.vr-networld-ebanking.de/index.php?RZKZ=XC&RZBK=0629" },
  { id: "vr-bank-nordrhoen-eg", name: "VR-Bank NordRhön eG", group: "Volksbanken Raiffeisenbanken", blz: "53061230", keywords: ["hünfeld"] , onlineBankingUrl: "https://www.vr-bank-nordrhoen.de/services_cloud/portal" },
  { id: "huettenberger-bank-eg", name: "Hüttenberger Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "50069455", keywords: ["hüttenberg"] , onlineBankingUrl: "https://www.huettenberger-bank.de/services_cloud/portal" },
  { id: "volksbank-kassel-goettingen-eg", name: "Volksbank Kassel Göttingen eG", group: "Volksbanken Raiffeisenbanken", blz: "52090000", keywords: ["kassel"] , onlineBankingUrl: "https://www.volksbank-kassel-goettingen.de/services_cloud/portal" },
  { id: "raiffeisenbank-kirtorf-eg", name: "Raiffeisenbank Kirtorf eG", group: "Volksbanken Raiffeisenbanken", blz: "50069477", keywords: ["kirtorf"] , onlineBankingUrl: "https://www.rb-kirtorf.de/services_cloud/portal" },
  { id: "waldeck-frankenberger-bank-eg", name: "Waldeck-Frankenberger Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "52360059", keywords: ["korbach"] , onlineBankingUrl: "https://www.waldecker-bank.de/services_cloud/portal" },
  { id: "vr-partnerbank-eg-chattengau-schwalm-ede", name: "VR PartnerBank eG Chattengau-Schwalm-Eder", group: "Volksbanken Raiffeisenbanken", blz: "52062601", keywords: ["melsungen"] , onlineBankingUrl: "https://www.vr-partnerbank.de/services_cloud/portal" },
  { id: "volksbank-ober-moerlen-eg", name: "Volksbank Ober-Mörlen eG", group: "Volksbanken Raiffeisenbanken", blz: "51861806", keywords: ["ober-mörlen"] , onlineBankingUrl: "https://www.voba-ober-moerlen.de/services_cloud/portal" },
  { id: "raiffeisenbank-biebergrund-petersberg-eg", name: "Raiffeisenbank Biebergrund-Petersberg eG", group: "Volksbanken Raiffeisenbanken", blz: "53062350", keywords: ["petersberg"] , onlineBankingUrl: "https://www.rb-biebergrund-petersberg.de/services_cloud/portal" },
  { id: "landbank-horlofftal-eg", name: "Landbank Horlofftal eG", group: "Volksbanken Raiffeisenbanken", blz: "51861616", keywords: ["reichelsheim (wetterau)"] },
  { id: "vereinigte-volksbank-raiffeisenbank-eg", name: "Vereinigte Volksbank Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "50863513", keywords: ["reinheim"] , onlineBankingUrl: "https://www.vvrb.de/services_cloud/portal" },
  { id: "volksbank-weschnitztal-eg", name: "Volksbank Weschnitztal eG", group: "Volksbanken Raiffeisenbanken", blz: "50961592", keywords: ["rimbach"] , onlineBankingUrl: "https://www.volksbank-weschnitztal.de/services_cloud/portal" },
  { id: "raiffeisenbank-eg-3699", name: "Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "50663699", keywords: ["rodenbach"] , onlineBankingUrl: "https://www.rbrodenbach.de/services_cloud/portal" },
  { id: "volksbank-seligenstadt-eg", name: "Volksbank Seligenstadt eG", group: "Volksbanken Raiffeisenbanken", blz: "50692100", keywords: ["seligenstadt"] , onlineBankingUrl: "https://www.voba-seligenstadt.de/services_cloud/portal" },
  { id: "vr-bank-spangenberg-morschen-eg", name: "VR-Bank Spangenberg - Morschen eG", group: "Volksbanken Raiffeisenbanken", blz: "52063369", keywords: ["spangenberg"] , onlineBankingUrl: "https://www.vr-partnerbank.de/services_cloud/portal" },
  { id: "volksbank-ulrichstein-eg", name: "Volksbank Ulrichstein eG", group: "Volksbanken Raiffeisenbanken", blz: "51961023", keywords: ["ulrichstein"] , onlineBankingUrl: "https://www.volksbank-ulrichstein.de/services_cloud/portal" },
  { id: "volksbank-brandoberndorf-eg", name: "Volksbank Brandoberndorf eG", group: "Volksbanken Raiffeisenbanken", blz: "51591300", keywords: ["waldsolms"] , onlineBankingUrl: "https://www.vb-brandoberndorf.de/services_cloud/portal" },
  { id: "volksbank-wissmar-eg", name: "Volksbank Wißmar eG", group: "Volksbanken Raiffeisenbanken", blz: "50069976", keywords: ["wettenberg"] , onlineBankingUrl: "https://www.volksbank-wissmar.de/services_cloud/portal" },
  { id: "wiesbadener-volksbank-eg", name: "Wiesbadener Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "51090000", keywords: ["wiesbaden"] , onlineBankingUrl: "https://www.wvb.de/services_cloud/portal" },
  { id: "raiffeisenbank-hessennord-eg", name: "Raiffeisenbank HessenNord eG", group: "Volksbanken Raiffeisenbanken", blz: "52063550", keywords: ["wolfhagen"] , onlineBankingUrl: "https://www.rb-hessennord.de/services_cloud/portal" },
  { id: "volksbank-demmin-eg", name: "Volksbank Demmin eG", group: "Volksbanken Raiffeisenbanken", blz: "15091674", keywords: ["demmin"] , onlineBankingUrl: "https://www.volksbank-demmin.de/services_cloud/portal" },
  { id: "raiffeisenbank-eg-9177", name: "Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "20069177", keywords: ["hagenow"] , onlineBankingUrl: "https://www.rbsum.de/services_cloud/portal" },
  { id: "vr-bank-mecklenburg-eg", name: "VR Bank Mecklenburg eG", group: "Volksbanken Raiffeisenbanken", blz: "14061308", keywords: ["rostock"] , onlineBankingUrl: "https://www.vrbankmecklenburg.de/services_cloud/portal" },
  { id: "volksbank-vorpommern-eg", name: "Volksbank Vorpommern eG", group: "Volksbanken Raiffeisenbanken", blz: "13091054", keywords: ["stralsund"] , onlineBankingUrl: "https://www.pommerschevb.de/services_cloud/portal" },
  { id: "raiffeisenbank-mecklenburger-seenplatte-", name: "Raiffeisenbank Mecklenburger Seenplatte eG", group: "Volksbanken Raiffeisenbanken", blz: "15061618", keywords: ["waren (müritz)"], onlineBankingUrl: "https://www.raiba-seenplatte.de/ptlweb/WebPortal?bankid=2734" },
  { id: "volksbank-eg-1556", name: "Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "26061556", keywords: ["adelebsen"] },
  { id: "volksbank-geest-eg", name: "Volksbank Geest eG", group: "Volksbanken Raiffeisenbanken", blz: "20069782", keywords: ["apensen"] , onlineBankingUrl: "https://www.vbgeest.de/services_cloud/portal" },
  { id: "raiffeisen-volksbank-eg", name: "Raiffeisen-Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "28562297", keywords: ["aurich"] , onlineBankingUrl: "https://www.meine-rvb.de/services_cloud/portal" },
  { id: "volksbank-im-elbe-weser-dreieck-eg", name: "Volksbank im Elbe-Weser-Dreieck eG", group: "Volksbanken Raiffeisenbanken", blz: "29265747", keywords: ["beverstedt"] , onlineBankingUrl: "https://www.volksbankeg.de/services_cloud/portal" },
  { id: "volksbank-nordhuemmling-eg", name: "Volksbank Nordhümmling eG", group: "Volksbanken Raiffeisenbanken", blz: "28069706", keywords: ["börger"] , onlineBankingUrl: "https://www.vb-nordhuemmling.de/services_cloud/portal" },
  { id: "volksbank-boerssum-hornburg-eg", name: "Volksbank Börßum-Hornburg eG", group: "Volksbanken Raiffeisenbanken", blz: "27062290", keywords: ["börßum"] , onlineBankingUrl: "https://www.vbbh.de/services_cloud/portal" },
  { id: "raiffeisenbank-wesermarsch-sued-eg", name: "Raiffeisenbank Wesermarsch-Süd eG", group: "Volksbanken Raiffeisenbanken", blz: "28061410", keywords: ["brake"] , onlineBankingUrl: "https://www.raibawesermarschsued.de/services_cloud/portal" },
  { id: "volksbank-braunlage-eg", name: "Volksbank Braunlage eG", group: "Volksbanken Raiffeisenbanken", blz: "27893359", keywords: ["braunlage"] , onlineBankingUrl: "https://www.vbbraunlage.de/services_cloud/portal" },
  { id: "volksbank-eg-emstek-essen-cappeln", name: "Volksbank eG Emstek Essen Cappeln", group: "Volksbanken Raiffeisenbanken", blz: "28063526", keywords: ["cappeln"] , onlineBankingUrl: "https://www.vbessen-cappeln.de/services_cloud/portal" },
  { id: "geno-bank-essen-eg", name: "GENO BANK Essen eG", group: "Volksbanken Raiffeisenbanken", blz: "36060488", keywords: ["essen", "genobank", "geno bank"] , onlineBankingUrl: "https://www.genobank.de/services_cloud/portal", logo: "geno-bank-essen-logo", hideNameInHeader: true },
  { id: "volksbank-eg-suedheide-isenhagener-land-", name: "Volksbank eG Südheide – Isenhagener Land – Altmark", group: "Volksbanken Raiffeisenbanken", blz: "25791635", keywords: ["celle"] , onlineBankingUrl: "https://www.vbsila.de/services_cloud/portal" },
  { id: "volksbank-im-wesertal-eg", name: "Volksbank im Wesertal eG", group: "Volksbanken Raiffeisenbanken", blz: "25462680", keywords: ["coppenbrügge"] , onlineBankingUrl: "https://www.vb-iw.de/services_cloud/portal" },
  { id: "volksbank-dammer-berge-eg", name: "Volksbank Dammer Berge eG", group: "Volksbanken Raiffeisenbanken", blz: "28061679", keywords: ["damme"] , onlineBankingUrl: "https://www.vobda.de/services_cloud/portal" },
  { id: "vr-bank-mitte-eg", name: "VR-Bank Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "52260385", keywords: ["duderstadt"] , onlineBankingUrl: "https://www.vrbankmitte.de/services_cloud/portal" },
  { id: "volksbank-eg-9812", name: "Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "20069812", keywords: ["fredenbeck"] , onlineBankingUrl: "https://www.vbfoa.de/services_cloud/portal" },
  { id: "raiffeisenbank-wiesedermeer-wiesede-marc", name: "Raiffeisenbank Wiesedermeer-Wiesede-Marcardsmoor eG", group: "Volksbanken Raiffeisenbanken", blz: "28069773", keywords: ["friedeburg"] , onlineBankingUrl: "https://www.raibawiesedermeer.de/services_cloud/portal" },
  { id: "volksbank-eg-6620", name: "Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "28066620", keywords: ["friesoythe"] , onlineBankingUrl: "https://www.meine-volksbank-online.de/services_cloud/portal" },
  { id: "vr-bank-eg-osnabruecker-nordland", name: "VR-Bank eG Osnabrücker Nordland", group: "Volksbanken Raiffeisenbanken", blz: "26567943", keywords: ["fürstenau"] , onlineBankingUrl: "https://www.vrbank-osnordland.de/services_cloud/portal" },
  { id: "vr-bank-in-suedoldenburg-eg", name: "VR-Bank in Südoldenburg eG", group: "Volksbanken Raiffeisenbanken", blz: "28061501", keywords: ["garrel"] , onlineBankingUrl: "https://www.vrbank-suedoldenburg.de/services_cloud/portal" },
  { id: "volksbank-geeste-nord-eg", name: "Volksbank Geeste-Nord eG", group: "Volksbanken Raiffeisenbanken", blz: "29262722", keywords: ["geestland"] , onlineBankingUrl: "https://www.vbgn.de/services_cloud/portal" },
  { id: "volksbank-duete-ems-eg", name: "Volksbank Düte-Ems eG", group: "Volksbanken Raiffeisenbanken", blz: "26565928", keywords: ["georgsmarienhütte"] , onlineBankingUrl: "https://www.vbghb.de/services_cloud/portal" },
  { id: "volksbank-nordharz-eg", name: "Volksbank Nordharz eG", group: "Volksbanken Raiffeisenbanken", blz: "26890019", keywords: ["goslar"] , onlineBankingUrl: "https://www.vbnh.de/services_cloud/portal" },
  { id: "volksbank-hameln-stadthagen-eg", name: "Volksbank Hameln-Stadthagen eG", group: "Volksbanken Raiffeisenbanken", blz: "25462160", keywords: ["hameln"] , onlineBankingUrl: "https://www.volksbank-hameln-stadthagen.de/services_cloud/portal" },
  { id: "spar-und-kreditbank-eg", name: "Spar- und Kreditbank eG", group: "Volksbanken Raiffeisenbanken", blz: "20069800", keywords: ["hammah"] , onlineBankingUrl: "https://www.skb-hammah.de/services_cloud/portal" },
  { id: "hannoversche-volksbank-eg", name: "Hannoversche Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "25190001", keywords: ["hannover"] , onlineBankingUrl: "https://www.hannoversche-volksbank.de/services_cloud/portal" },
  { id: "volksbank-solling-eg", name: "Volksbank Solling eG", group: "Volksbanken Raiffeisenbanken", blz: "26261693", keywords: ["hardegsen"] , onlineBankingUrl: "https://www.vbsolling.de/services_cloud/portal" },
  { id: "volksbank-emstal-eg", name: "Volksbank Emstal eG", group: "Volksbanken Raiffeisenbanken", blz: "28069991", keywords: ["haren (ems)"], onlineBankingUrl: "https://internetbanking.gad.de/banking/portal?bankid=6063" },
  { id: "volksbank-haseluenne-eg", name: "Volksbank Haselünne eG", group: "Volksbanken Raiffeisenbanken", blz: "26661380", keywords: ["haselünne"] , onlineBankingUrl: "https://www.vbhaseluenne.de/services_cloud/portal" },
  { id: "volksbank-eg-3331", name: "Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "25193331", keywords: ["hildesheim"] , onlineBankingUrl: "https://www.vb-eg.de/services_cloud/portal" },
  { id: "volksbank-eg-bad-laer-borgloh-hilter-mel", name: "Volksbank eG Bad Laer-Borgloh-Hilter-Melle", group: "Volksbanken Raiffeisenbanken", blz: "26562490", keywords: ["hilter"] , onlineBankingUrl: "https://www.voba-eg.de/services_cloud/portal" },
  { id: "vr-bank-in-suedniedersachsen-eg", name: "VR-Bank in Südniedersachsen eG", group: "Volksbanken Raiffeisenbanken", blz: "26062433", keywords: ["holzminden"] , onlineBankingUrl: "https://www.vrbanksn.de/services_cloud/portal" },
  { id: "volksbank-niedersachsen-mitte-eg", name: "Volksbank Niedersachsen-Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "25691633", keywords: ["hoya"] , onlineBankingUrl: "https://www.volksbank-niedersachsen-mitte.de/services_cloud/portal" },

  // ─── PSD Banken ───────────────────────────────────────────────────────
  
  { id: "psd-nord", name: "PSD Bank Nord eG", group: "PSD Banken", blz: "20090900", keywords: ["hamburg", "schleswig-holstein"], logo: "psd-nord-logo", hideNameInHeader: true },
  { id: "psd-rhein-ruhr", name: "PSD Bank Rhein-Ruhr eG", group: "PSD Banken", blz: "30060998", keywords: ["düsseldorf", "essen", "duisburg"], logo: "psd-rhein-ruhr-logo", hideNameInHeader: true },
  { id: "psd-west", name: "PSD Bank West eG", group: "PSD Banken", blz: "30060992", keywords: ["köln", "bonn", "aachen"], logo: "psd-west-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.psd-west.de/services_cloud/portal/" },
  { id: "psd-rheinneckarsaar", name: "PSD Bank RheinNeckarSaar eG", group: "PSD Banken", blz: "59090900", keywords: ["saarbrücken", "mannheim", "heidelberg"], logo: "psd-bank-logo", onlineBankingUrl: "https://www.psd-rns.de/services_cloud/portal/" },
  { id: "psd-koblenz", name: "PSD Bank Koblenz eG", group: "PSD Banken", blz: "57090900", keywords: ["koblenz"], logo: "psd-bank-logo", onlineBankingUrl: "https://www.psd-koblenz.de/services_cloud/portal/" },
  { id: "psd-hessen-thueringen", name: "PSD Bank Hessen-Thüringen eG", group: "PSD Banken", blz: "50090900", keywords: ["frankfurt", "erfurt", "hessen", "thüringen"], logo: "psd-bank-logo", onlineBankingUrl: "https://www.psd-ht.de/services_cloud/portal/" },
  { id: "psd-nuernberg", name: "PSD Bank Nürnberg eG", group: "PSD Banken", blz: "76090500", keywords: ["nürnberg"], logo: "psd-nuernberg-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.psd-nuernberg.de/services_cloud/portal/" },
  { id: "psd-muenchen", name: "PSD Bank München eG", group: "PSD Banken", blz: "70090500", keywords: ["münchen"], logo: "psd-bank-logo", onlineBankingUrl: "https://www.psd-muenchen.de/services_cloud/portal/" },
  { id: "psd-karlsruhe", name: "PSD Bank Karlsruhe-Neustadt eG", group: "PSD Banken", blz: "66090900", keywords: ["karlsruhe"], logo: "psd-bank-logo", onlineBankingUrl: "https://www.psd-kn.de/services_cloud/portal/" },
  { id: "psd-hannover", name: "PSD Bank Hannover eG", group: "PSD Banken", blz: "25090900", keywords: ["hannover"], logo: "psd-bank-logo", onlineBankingUrl: "https://www.psd-hannover.de/services_cloud/portal/" },
  { id: "psd-braunschweig", name: "PSD Bank Braunschweig eG", group: "PSD Banken", blz: "27090900", keywords: ["braunschweig"], logo: "psd-braunschweig-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.psd-braunschweig.de/services_cloud/portal/" },

  // ─── GLS Bank ─────────────────────────────────────────────────────────
  { id: "gls", name: "GLS Gemeinschaftsbank eG", group: "GLS Bank", blz: "43060967", aliases: ["gls bank"], keywords: ["bochum"], logo: "gls-bank-logo", hideNameInHeader: true },

  // ─── Sparda-Banken ────────────────────────────────────────────────────
  { id: "sparda-west", name: "Sparda-Bank West eG", group: "Sparda-Banken", blz: "33060592", keywords: ["düsseldorf", "essen", "duisburg"], logo: "sparda-bank-generic-logo", onlineBankingUrl: "https://www.sparda-west.de/services_cloud/portal/" },
  { id: "sparda-bw", name: "Sparda-Bank Baden-Württemberg eG", group: "Sparda-Banken", blz: "60090800", keywords: ["stuttgart", "karlsruhe", "freiburg"], logo: "sparda-bank-bw-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.sparda-bw.de/services_cloud/portal/" },
  { id: "sparda-muenchen", name: "Sparda-Bank München eG", group: "Sparda-Banken", blz: "70090500", keywords: ["münchen"], logo: "sparda-bank-muenchen-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.sparda-m.de/services_cloud/portal/" },
  { id: "sparda-hessen", name: "Sparda-Bank Hessen eG", group: "Sparda-Banken", blz: "50090500", keywords: ["frankfurt", "darmstadt"], logo: "sparda-bank-hessen-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.sparda-hessen.de/services_cloud/portal/" },
  { id: "sparda-sw", name: "Sparda-Bank Südwest eG", group: "Sparda-Banken", blz: "55090500", keywords: ["mainz", "koblenz", "trier"], logo: "sparda-bank-generic-logo", onlineBankingUrl: "https://www.sparda-sw.de/services_cloud/portal/" },
  { id: "sparda-nuernberg", name: "Sparda-Bank Nürnberg eG", group: "Sparda-Banken", blz: "76090500", keywords: ["nürnberg"], logo: "sparda-bank-generic-logo", onlineBankingUrl: "https://www.sparda-n.de/services_cloud/portal/" },
  { id: "sparda-berlin", name: "Sparda-Bank Berlin eG", group: "Sparda-Banken", blz: "12096597", keywords: ["berlin"], logo: "sparda-bank-berlin-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.sparda-berlin.de/services_cloud/portal/" },
  { id: "sparda-hannover", name: "Sparda-Bank Hannover eG", group: "Sparda-Banken", blz: "25090500", keywords: ["hannover"], logo: "sparda-bank-hannover-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.sparda-hannover.de/services_cloud/portal/" },
  { id: "sparda-hamburg", name: "Sparda-Bank Hamburg eG", group: "Sparda-Banken", blz: "20690500", keywords: ["hamburg"], logo: "sparda-bank-hamburg-logo", hideNameInHeader: true, onlineBankingUrl: "https://www.sparda-hh.de/services_cloud/portal/" },
  { id: "sparda-ostbayern", name: "Sparda-Bank Ostbayern eG", group: "Sparda-Banken", blz: "75090500", keywords: ["regensburg"], logo: "sparda-bank-generic-logo", onlineBankingUrl: "https://www.sparda-ostbayern.de/services_cloud/portal/" },
  { id: "sparda-augsburg", name: "Sparda-Bank Augsburg eG", group: "Sparda-Banken", blz: "72090900", keywords: ["augsburg"], hideNameInHeader: true },
  { id: "sparda-bayern", name: "Sparda-Bank Bayern eG", group: "Sparda-Banken", blz: "70090500", keywords: ["münchen", "bayern"], logo: "sparda-bank-generic-logo", onlineBankingUrl: "https://www.sparda-bayern.de/services_cloud/portal/" },

  // ─── BBBank ───────────────────────────────────────────────────────────
  { id: "bbbank", name: "BBBank eG", group: "BBBank", blz: "66090800", keywords: ["karlsruhe"], logo: "bbbank-logo", hideNameInHeader: true },

  // ─── Ergänzungen aus Liste_AlleBanken_2025 (UNGEPRÜFT — Link & Logo prüfen) ───
  { id: "aachener-bank-eg", name: "Aachener Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["aachen"], unverified: true },
  { id: "bank-fuer-kirche-und-caritas-eg", name: "Pax-Bank für Kirche und Caritas eG", group: "Volksbanken Raiffeisenbanken", keywords: ["paderborn", "kirche", "caritas", "pax"], customTheme: { primary: "25 100% 38%", headerBg: "#ffffff", buttonBg: "#C25700", accentText: "#C25700", topBarColor: "#C25700" }, unverified: true },
  
  { id: "bensberger-bank-eg", name: "Bensberger Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["bergisch gladbach", "bensberg"], unverified: true },
  { id: "bruehler-bank-eg", name: "Brühler Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["brühl"], unverified: true },
  
  { id: "eckernfoerder-bank-eg", name: "Eckernförder Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["eckernförde"], unverified: true },
  { id: "evangelische-bank-eg", name: "Evangelische Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["kassel", "evangelisch", "kirche"], customTheme: { primary: "279 49% 27%", headerBg: "#ffffff", buttonBg: "#5C2D67", accentText: "#5C2D67", topBarColor: "#5C2D67" }, unverified: true },
  { id: "freikirchen-bank-eg", name: "Freikirchen.Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["bad homburg", "freikirchen"], unverified: true },
  { id: "hausbank-muenchen-eg", name: "Hausbank München eG", group: "Volksbanken Raiffeisenbanken", keywords: ["münchen", "hausbank"], customTheme: { primary: "207 47% 33%", headerBg: "#ffffff", buttonBg: "#2E5F7D", accentText: "#2E5F7D", topBarColor: "#2E5F7D" }, unverified: true },
  { id: "kurhessische-landbank-eg", name: "Kurhessische Landbank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["kassel", "hessen"], unverified: true },
  { id: "mendener-bank-eg", name: "Mendener Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["menden", "sauerland"], unverified: true },
  { id: "maerkische-bank-eg", name: "Märkische Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["hagen", "märkisch"], unverified: true },
  
  { id: "sylter-bank-eg", name: "Sylter Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["sylt", "westerland"], unverified: true },
  { id: "vr-bank-bad-salzungen-schmalkalden-eg", name: "VR-Bank Bad Salzungen Schmalkalden eG", group: "Volksbanken Raiffeisenbanken", keywords: ["bad salzungen", "schmalkalden", "thüringen"], unverified: true },
  { id: "vr-bank-ihre-heimatbank-eg", name: "VR Bank Ihre Heimatbank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["heimatbank"], unverified: true },
  { id: "vr-bank-rheinaheifel-eg", name: "VR Bank RheinAhrEifel eG", group: "Volksbanken Raiffeisenbanken", keywords: ["mayen", "rhein", "ahr", "eifel"], unverified: true },
  { id: "vr-bank-schleswig-holstein-mitte-eg", name: "VR Bank Schleswig-Holstein Mitte eG", group: "Volksbanken Raiffeisenbanken", keywords: ["rendsburg", "schleswig-holstein"], unverified: true },
  { id: "vr-bank-suedliche-weinstrasse-wasgau-eg", name: "VR Bank Südliche Weinstraße-Wasgau eG", group: "Volksbanken Raiffeisenbanken", keywords: ["landau", "weinstraße", "wasgau", "pfalz"], unverified: true },
  { id: "vr-bank-suedpfalz-eg", name: "VR Bank Südpfalz eG", group: "Volksbanken Raiffeisenbanken", keywords: ["landau", "südpfalz"], unverified: true },
  { id: "vr-bank-weimar-eg", name: "VR Bank Weimar eG", group: "Volksbanken Raiffeisenbanken", keywords: ["weimar", "thüringen"], unverified: true },
  { id: "vr-bank-westfalen-lippe-eg", name: "VR Bank Westfalen-Lippe eG", group: "Volksbanken Raiffeisenbanken", keywords: ["münster", "westfalen", "lippe"], unverified: true },
  { id: "vr-bank-in-holstein-eg", name: "VR Bank in Holstein eG", group: "Volksbanken Raiffeisenbanken", keywords: ["norderstedt", "holstein"], unverified: true },
  { id: "vr-bank-in-thueringen-eg", name: "VR Bank in Thüringen eG", group: "Volksbanken Raiffeisenbanken", keywords: ["erfurt", "thüringen"], unverified: true },
  { id: "vr-bank-zwischen-den-meeren-eg", name: "VR Bank zwischen den Meeren eG", group: "Volksbanken Raiffeisenbanken", keywords: ["niebüll", "husum", "schleswig"], unverified: true },
  { id: "vr-bank-altenburger-land-eg", name: "VR-Bank Altenburger Land eG", group: "Volksbanken Raiffeisenbanken", keywords: ["altenburg", "thüringen"], unverified: true },
  { id: "vr-bank-bonn-rhein-sieg-eg", name: "VR-Bank Bonn Rhein-Sieg eG", group: "Volksbanken Raiffeisenbanken", keywords: ["bonn", "rhein-sieg", "siegburg"], unverified: true },
  { id: "vr-bank-freudenberg-niederfischbach-eg", name: "VR-Bank Freudenberg-Niederfischbach eG", group: "Volksbanken Raiffeisenbanken", keywords: ["freudenberg", "niederfischbach", "siegerland"], unverified: true },
  { id: "vr-bank-nordeifel-eg", name: "VR-Bank Nordeifel eG", group: "Volksbanken Raiffeisenbanken", keywords: ["schleiden", "nordeifel"], unverified: true },
  { id: "vr-bank-suedwestpfalz-eg", name: "VR-Bank Südwestpfalz eG", group: "Volksbanken Raiffeisenbanken", keywords: ["pirmasens", "südwestpfalz"], unverified: true },
  { id: "vereinigte-vr-bank-kur-und-rheinpfalz-eg", name: "Vereinigte VR Bank Kur- und Rheinpfalz eG", group: "Volksbanken Raiffeisenbanken", keywords: ["speyer", "rheinpfalz", "kurpfalz"], unverified: true },
  { id: "westerwald-bank-eg", name: "Westerwald Bank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["hachenburg", "westerwald"], unverified: true },
  { id: "levobank-eg", name: "levoBank eG", group: "Volksbanken Raiffeisenbanken", keywords: ["bexbach", "saarland"], unverified: true },
  // ─── Ergänzungen aus Bundesbank-BLZ-Verzeichnis 2026 (UNGEPRÜFT — Link & Logo prüfen) ───
  { id: "agrarbank-eg", name: "AgrarBank eG", group: "Volksbanken Raiffeisenbanken", blz: "53093255", keywords: ["alsfeld", "36295", "GENODE51AGR"], unverified: true },
  { id: "allgaeuer-volksbank-kempten-sonthofen-eg", name: "Allgäuer Volksbank Kempten-Sonthofen eG", group: "Volksbanken Raiffeisenbanken", blz: "73390000", keywords: ["kempten (allgäu)", "87416", "GENODEF1KEV"], unverified: true },
  { id: "bvb-volksbank-ndl-d-frankfurter-volksbank-eg", name: "BVB Volksbank Ndl d Frankfurter Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "51861325", keywords: ["bad vilbel", "61101", "GENODEF1BVB"], unverified: true },
  { id: "bank-im-bistum-essen-eg", name: "Bank im Bistum Essen eG", group: "Volksbanken Raiffeisenbanken", blz: "36060295", keywords: ["essen", "45008", "GENODED1BBE", "bib", "fairbanking"], customTheme: { primary: "231 50% 23%", headerBg: "#ffffff", buttonBg: "#1F2A5C", accentText: "#1F2A5C", topBarColor: "#1F2A5C", buttonRadius: "rounded-none" }, unverified: true },
  { id: "mlp-banking-ag", name: "MLP Banking AG", group: "Volksbanken Raiffeisenbanken", blz: "67230000", keywords: ["wiesloch", "69168", "mlp", "MLPBDE61", "financepilot"], aliases: ["mlp bank", "mlp"], customTheme: { primary: "210 100% 15%", headerBg: "#ffffff", buttonBg: "#003a5d", accentText: "#003a5d", topBarColor: "#003a5d", buttonRadius: "rounded-full" }, logo: "mlp-logo", hideNameInHeader: true, onlineBankingUrl: "https://financepilot-pe.mlp.de/services_cloud/portal/" },
  { id: "bankhaus-rautenschlein-eg", name: "Bankhaus Rautenschlein eG", group: "Volksbanken Raiffeisenbanken", blz: "27131300", keywords: ["schöningen", "38364", "GENODEF1RTS", "rautenschlein", "bankhaus seit 1899"], customTheme: { primary: "41 75% 28%", headerBg: "#8a6d1a", buttonBg: "#8a6d1a", accentText: "#8a6d1a", topBarColor: "#8a6d1a", buttonRadius: "rounded-none" }, unverified: true },
  { id: "budenheimer-volksbank-eg", name: "Budenheimer Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "55061303", keywords: ["budenheim", "55254", "GENODE51BUD"], unverified: true },
  { id: "cvw-privatbank-eg", name: "CVW-Privatbank eG", group: "Volksbanken Raiffeisenbanken", blz: "76211900", keywords: ["wilhermsdorf", "91452", "GENODEF1WHD", "cvw", "privatbank"], customTheme: { primary: "0 0% 30%", headerBg: "#ffffff", buttonBg: "#4a4a4a", accentText: "#4a4a4a", topBarColor: "#8cc63f", buttonRadius: "rounded-full" }, unverified: true },
  { id: "cronbank-eg", name: "Cronbank eG", group: "Volksbanken Raiffeisenbanken", blz: "50530000", keywords: ["dreieich", "63303", "GENODE51CRO", "cron", "einfach machen"], customTheme: { primary: "0 85% 45%", headerBg: "#ffffff", buttonBg: "#d6122d", accentText: "#d6122d", topBarColor: "#4a4a4a", buttonRadius: "rounded-none" }, unverified: true },
  { id: "dkm-darlehnskasse-muenster-eg", name: "DKM Darlehnskasse Münster eG", group: "Volksbanken Raiffeisenbanken", blz: "40060265", keywords: ["münster", "48008", "GENODEM1DKM", "dkm", "kirche", "caritas"], customTheme: { primary: "326 95% 40%", headerBg: "#ffffff", buttonBg: "#c8127d", accentText: "#c8127d", topBarColor: "#4a5552", buttonRadius: "rounded-full" }, unverified: true },
  { id: "dithmarscher-volks-und-raiffeisenbank-eg", name: "Dithmarscher Volks- und Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "21890022", keywords: ["heide", "25746", "GENODEF1DVR"], unverified: true },
  { id: "dortmunder-volksbank-eg", name: "Dortmunder Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "44160014", keywords: ["dortmund", "44128", "GENODEM1DOR"], unverified: true },
  { id: "eckernfoerder-bank-volksbank-raiffeisenbank-eg", name: "Eckernförder Bank Volksbank-Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "21092023", keywords: ["eckernförde", "24331", "GENODEF1EFO"], unverified: true },
  { id: "emslaendische-volksbank-eg", name: "Emsländische Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "26660060", keywords: ["lingen (ems)", "49791", "GENODEF1LIG"], unverified: true },
  { id: "evangelische-bank-gf-gaa-eg", name: "Evangelische Bank (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "52060420", keywords: ["kassel", "34117", "GENODEF1EK1"], unverified: true },
  { id: "evenord-bank-eg", name: "Evenord-Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "76090400", keywords: ["nürnberg", "90439", "GENODEF1N03"], unverified: true },
  { id: "fellbacher-bank-eg", name: "Fellbacher Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "60261329", keywords: ["fellbach", "70703", "GENODES1FBB"], unverified: true },
  { id: "genobank-rhoen-grabfeld-eg", name: "Genobank Rhön-Grabfeld eG", group: "Volksbanken Raiffeisenbanken", blz: "84064798", keywords: ["meiningen", "98617", "GENODEF1MLF"], unverified: true },
  { id: "gladbacher-bank-von-1922-eg", name: "Gladbacher Bank von 1922 eG", group: "Volksbanken Raiffeisenbanken", blz: "31060181", keywords: ["mönchengladbach", "41006", "GENODED1GBM"], unverified: true },
  { id: "grafschafter-volksbank-eg", name: "Grafschafter Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "28069956", keywords: ["nordhorn", "48511", "GENODEF1NEV"], unverified: true },
  { id: "hamburger-volksbank-gf-gaa-eg", name: "Hamburger Volksbank (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "20190077", keywords: ["hamburg", "20097", "GENODEF1HH2"], unverified: true },
  { id: "harzer-volksbank-eg", name: "Harzer Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "80063508", keywords: ["wernigerode", "38855", "GENODEF1QLB"], unverified: true },
  { id: "huemmlinger-volksbank-eg", name: "Hümmlinger Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "28069381", keywords: ["werlte", "49757", "GENODEF1WLT"], unverified: true },
  { id: "kieler-volksbank-eg", name: "Kieler Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "21090007", keywords: ["kiel", "24027", "GENODEF1KIL"], unverified: true },
  { id: "kieler-volksbank-gf-gaa-eg", name: "Kieler Volksbank (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "21090099", keywords: ["kiel", "24027", "GENODEF1KIL"], unverified: true },
  { id: "liga-bank-eg", name: "LIGA Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "75090300", keywords: ["regensburg", "93006", "GENODEF1M05"], unverified: true },
  { id: "leipziger-volksbank-eg", name: "Leipziger Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "86095604", keywords: ["leipzig", "04109", "GENODEF1LVB"], unverified: true },
  { id: "merkur-privatbank-eg", name: "MERKUR PRIVATBANK eG", group: "Volksbanken Raiffeisenbanken", blz: "70130800", keywords: ["münchen", "80014", "GENODEF1M06", "merkur", "privatbank"], customTheme: { primary: "0 0% 12%", headerBg: "#ffffff", buttonBg: "#1f1f1f", accentText: "#1f1f1f", topBarColor: "#1f1f1f", buttonRadius: "rounded-full" }, unverified: true },
  { id: "mkb-mittelstandskreditbank-eg", name: "MKB Mittelstandskreditbank eG", group: "Volksbanken Raiffeisenbanken", blz: "20190800", keywords: ["hamburg", "22547", "GENODEF1MKB", "mkb", "handwerk"], customTheme: { primary: "210 75% 18%", headerBg: "#ffffff", buttonBg: "#0a2d52", accentText: "#0a2d52", topBarColor: "#0a2d52", buttonRadius: "rounded-none" }, unverified: true },
  { id: "oldenburger-volksbank-eg", name: "Oldenburger Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "28061822", keywords: ["oldenburg (oldb)", "26122", "GENODEF1EDE"], unverified: true },
  { id: "ostfriesische-volksbank-leer-eg", name: "Ostfriesische Volksbank Leer eG", group: "Volksbanken Raiffeisenbanken", blz: "28590075", keywords: ["leer (ostfriesland)", "26768", "GENODEF1LER"], unverified: true },
  { id: "pax-bank-eg", name: "Pax-Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "10060198", keywords: ["berlin", "14005", "GENODED1PA6"], unverified: true },
  
  { id: "raiffeisen-bank-eschweiler-eg", name: "Raiffeisen-Bank Eschweiler eG", group: "Volksbanken Raiffeisenbanken", blz: "39362254", keywords: ["eschweiler", "52231", "GENODED1RSC"], unverified: true },
  { id: "raiffeisen-volksbank-fresena-eg", name: "Raiffeisen-Volksbank Fresena eG", group: "Volksbanken Raiffeisenbanken", blz: "28361592", keywords: ["norden", "26506", "GENODEF1MAR"], unverified: true },
  { id: "raiffeisen-volksbank-hermsdorfer-kreuz-eg", name: "Raiffeisen-Volksbank Hermsdorfer Kreuz eG", group: "Volksbanken Raiffeisenbanken", blz: "83064488", keywords: ["hermsdorf", "07629", "GENODEF1HMF"], unverified: true },
  { id: "raiffeisen-volksbank-neustadt-eg", name: "Raiffeisen-Volksbank Neustadt eG", group: "Volksbanken Raiffeisenbanken", blz: "25069262", keywords: ["neustadt am rübenberge", "31535", "GENODEF1NST"], unverified: true },
  { id: "raiffeisen-volksbank-varel-nordenham-eg", name: "Raiffeisen-Volksbank Varel-Nordenham eG", group: "Volksbanken Raiffeisenbanken", blz: "28064241", keywords: ["nordenham", "26954", "GENODEF1NHE"], unverified: true },
  { id: "raiffeisenbank-aldenhoven-eg", name: "Raiffeisenbank Aldenhoven eG", group: "Volksbanken Raiffeisenbanken", blz: "37069103", keywords: ["aldenhoven", "52449", "GENODED1ALD"], unverified: true },
  { id: "raiffeisenbank-bad-homburg-ndl-d-frankfurtervb-eg", name: "Raiffeisenbank Bad Homburg Ndl d FrankfurterVB eG", group: "Volksbanken Raiffeisenbanken", blz: "50069693", keywords: ["bad homburg", "61352", "GENODE51BH1"], unverified: true },
  { id: "raiffeisenbank-eichenbuehl-und-umgebung-eg", name: "Raiffeisenbank Eichenbühl und Umgebung eG", group: "Volksbanken Raiffeisenbanken", blz: "79668509", keywords: ["eichenbühl", "63928", "GENODEF1ENB"], unverified: true },
  { id: "raiffeisenbank-eifel-eg", name: "Raiffeisenbank Eifel eG", group: "Volksbanken Raiffeisenbanken", blz: "37069642", keywords: ["simmerath", "52152", "GENODED1SMR"], unverified: true },
  { id: "raiffeisenbank-elbmarsch-eg", name: "Raiffeisenbank Elbmarsch eG", group: "Volksbanken Raiffeisenbanken", blz: "22163114", keywords: ["heist", "25492", "GENODEF1HTE"], unverified: true },
  { id: "raiffeisenbank-ems-vechte-eg", name: "Raiffeisenbank Ems-Vechte eG", group: "Volksbanken Raiffeisenbanken", blz: "28069878", keywords: ["klein berßen", "49777", "GENODEF1KBL"], unverified: true },
  { id: "raiffeisenbank-flachsmeer-eg", name: "Raiffeisenbank Flachsmeer eG", group: "Volksbanken Raiffeisenbanken", blz: "28562716", keywords: ["westoverledingen", "26810", "GENODEF1WEF"], unverified: true },
  { id: "raiffeisenbank-grafschaft-wachtberg-eg", name: "Raiffeisenbank Grafschaft-Wachtberg eG", group: "Volksbanken Raiffeisenbanken", blz: "57762265", keywords: ["grafschaft", "53501", "GENODED1GRO"], unverified: true },
  { id: "raiffeisenbank-grimma-eg", name: "Raiffeisenbank Grimma eG", group: "Volksbanken Raiffeisenbanken", blz: "86065483", keywords: ["grimma", "04662", "GENODEF1GMR"], unverified: true },
  { id: "raiffeisenbank-gymnich-eg", name: "Raiffeisenbank Gymnich eG", group: "Volksbanken Raiffeisenbanken", blz: "37069322", keywords: ["erftstadt", "50374", "GENODED1EGY"], unverified: true },
  { id: "raiffeisenbank-haibach-obernau-eg", name: "Raiffeisenbank Haibach-Obernau eG", group: "Volksbanken Raiffeisenbanken", blz: "79568518", keywords: ["haibach", "63803", "GENODEF1HAC"], unverified: true },
  { id: "raiffeisenbank-hofkirchen-bayerbach-eg", name: "Raiffeisenbank Hofkirchen-Bayerbach eG", group: "Volksbanken Raiffeisenbanken", blz: "74369068", keywords: ["laberweinting", "84082", "GENODEF1LWE"], unverified: true },
  { id: "raiffeisenbank-kaarst-eg", name: "Raiffeisenbank Kaarst eG", group: "Volksbanken Raiffeisenbanken", blz: "37069405", keywords: ["kaarst", "41564", "GENODED1KAA"], unverified: true },
  { id: "raiffeisenbank-kalbe-bismark-eg", name: "Raiffeisenbank Kalbe-Bismark eG", group: "Volksbanken Raiffeisenbanken", blz: "81063028", keywords: ["kalbe (milde)", "39624", "GENODEF1KAB"], unverified: true },
  { id: "raiffeisenbank-kastellaun-eg", name: "Raiffeisenbank Kastellaun eG", group: "Volksbanken Raiffeisenbanken", blz: "56061151", keywords: ["kastellaun", "56284", "GENODED1KSL"], unverified: true },
  { id: "raiffeisenbank-leezen-eg", name: "Raiffeisenbank Leezen eG", group: "Volksbanken Raiffeisenbanken", blz: "23061220", keywords: ["leezen", "23816", "GENODEF1LZN"], unverified: true },
  { id: "raiffeisenbank-lorup-eg", name: "Raiffeisenbank Lorup eG", group: "Volksbanken Raiffeisenbanken", blz: "28069935", keywords: ["lorup", "26900", "GENODEF1LRU"], unverified: true },
  { id: "raiffeisenbank-mehr-eg", name: "Raiffeisenbank MEHR eG", group: "Volksbanken Raiffeisenbanken", blz: "57069144", keywords: ["kaisersesch", "56759", "GENODED1KAI"], unverified: true },
  { id: "raiffeisenbank-mehring-leiwen-eg", name: "Raiffeisenbank Mehring-Leiwen eG", group: "Volksbanken Raiffeisenbanken", blz: "58561771", keywords: ["leiwen", "54340", "GENODED1MLW"], unverified: true },
  { id: "raiffeisenbank-moormerland-eg", name: "Raiffeisenbank Moormerland eG", group: "Volksbanken Raiffeisenbanken", blz: "28562863", keywords: ["holtland", "26835", "GENODEF1HTL"], unverified: true },
  { id: "raiffeisenbank-nahe-eg", name: "Raiffeisenbank Nahe eG", group: "Volksbanken Raiffeisenbanken", blz: "56261735", keywords: ["fischbach", "55743", "GENODED1FIN"], unverified: true },
  { id: "raiffeisenbank-neustadt-eg", name: "Raiffeisenbank Neustadt eG", group: "Volksbanken Raiffeisenbanken", blz: "57069238", keywords: ["neustadt (wied)", "53573", "GENODED1ASN"], unverified: true },
  { id: "raiffeisenbank-oldersum-eg", name: "Raiffeisenbank Oldersum eG", group: "Volksbanken Raiffeisenbanken", blz: "28069755", keywords: ["moormerland", "26802", "GENODEF1MLO"], unverified: true },
  { id: "raiffeisenbank-owschlag-eg", name: "Raiffeisenbank Owschlag eG", group: "Volksbanken Raiffeisenbanken", blz: "20069641", keywords: ["owschlag", "24811", "GENODEF1OWS"], unverified: true },
  { id: "raiffeisenbank-rastede-eg", name: "Raiffeisenbank Rastede eG", group: "Volksbanken Raiffeisenbanken", blz: "28062165", keywords: ["rastede", "26170", "GENODEF1RSE"], unverified: true },
  { id: "raiffeisenbank-scharrel-eg", name: "Raiffeisenbank Scharrel eG", group: "Volksbanken Raiffeisenbanken", blz: "28065286", keywords: ["saterland", "26683", "GENODEF1SAN"], unverified: true },
  { id: "raiffeisenbank-struecklingen-idafehn-eg", name: "Raiffeisenbank Strücklingen-Idafehn eG", group: "Volksbanken Raiffeisenbanken", blz: "28069052", keywords: ["ostrhauderfehn", "26842", "GENODEF1ORF"], unverified: true },
  { id: "raiffeisenbank-voreifel-eg", name: "Raiffeisenbank Voreifel eG", group: "Volksbanken Raiffeisenbanken", blz: "37069627", keywords: ["rheinbach", "53359", "GENODED1RBC"], unverified: true },
  { id: "raiffeisenbank-welling-eg", name: "Raiffeisenbank Welling eG", group: "Volksbanken Raiffeisenbanken", blz: "57069361", keywords: ["welling", "56753", "GENODED1WLG"], unverified: true },
  { id: "raiffeisenbank-westeifel-eg", name: "Raiffeisenbank Westeifel eG", group: "Volksbanken Raiffeisenbanken", blz: "58661901", keywords: ["arzfeld", "54687", "GENODED1WSC"], unverified: true },
  { id: "raiffeisenbank-in-rheinhessen-eg", name: "Raiffeisenbank in Rheinhessen eG", group: "Volksbanken Raiffeisenbanken", blz: "55060611", keywords: ["mainz", "55120", "GENODE51MZ6"], unverified: true },
  { id: "rheingauer-volksbank-gf-gaa-eg", name: "Rheingauer Volksbank (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "51091501", keywords: ["geisenheim", "65366", "GENODE51RGG"], unverified: true },
  { id: "ritterschaftliches-kreditinstitut-stade-eg", name: "Ritterschaftliches Kreditinstitut Stade eG", group: "Volksbanken Raiffeisenbanken", blz: "24121000", keywords: ["stade", "21682", "GENODED1RKI"], unverified: true },
  { id: "spar-u-darlehnskasse-boerde-lamstedt-hechthausen-eg", name: "Spar- u Darlehnskasse Börde Lamstedt-Hechthausen eG", group: "Volksbanken Raiffeisenbanken", blz: "24162898", keywords: ["lamstedt", "21769", "GENODEF1LAS"], unverified: true },
  { id: "spar-u-kreditbank-d-bundes-fr-ev-gemeinden-eg", name: "Spar- u Kreditbank d Bundes Fr ev Gemeinden eG", group: "Volksbanken Raiffeisenbanken", blz: "45260475", keywords: ["witten", "58426", "GENODEM1BFG", "skb", "evangelisch", "freier"], unverified: true, customTheme: { primary: "168 100% 22%", headerBg: "#006e58", buttonBg: "#006e58", accentText: "#006e58", topBarColor: "#006e58", buttonRadius: "rounded-full" } },
  { id: "spar-und-darlehnskasse-bockum-hoevel-eg", name: "Spar- und Darlehnskasse Bockum-Hövel eG", group: "Volksbanken Raiffeisenbanken", blz: "41061011", keywords: ["hamm", "59038", "GENODEM1HBH"], unverified: true },
  { id: "steyler-bank-eg", name: "Steyler Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "38621500", keywords: ["sankt augustin", "53754", "GENODED1STB", "steyler", "ethik"], unverified: true, customTheme: { primary: "210 51% 35%", headerBg: "#ffffff", buttonBg: "#2b5d8a", accentText: "#2b5d8a", topBarColor: "#2b5d8a", buttonRadius: "rounded-full" } },
  { id: "vb-moerfelden-walldorf-ndl-d-frankfurter-vb-eg", name: "VB Mörfelden-Walldorf Ndl d Frankfurter VB eG", group: "Volksbanken Raiffeisenbanken", blz: "50865224", keywords: ["mörfelden-walldorf", "64532", "GENODE51MWA"], unverified: true },
  { id: "vr-bank-eg", name: "VR Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "30560548", keywords: ["monheim am rhein", "40789", "GENODED1NLD"], unverified: true },
  { id: "vr-bank-gf-gaa-eg", name: "VR Bank (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "30560591", keywords: ["monheim am rhein", "40789", "GENODED1NLD"], unverified: true },
  { id: "vr-bank-alzey-land-schwabenheim-eg", name: "VR Bank Alzey-Land-Schwabenheim eG", group: "Volksbanken Raiffeisenbanken", blz: "50069126", keywords: ["schwabenheim an der selz", "55270", "GENODE51ABO"], unverified: true },
  { id: "vr-bank-bergisch-gladbach-leverkusen-eg", name: "VR Bank Bergisch Gladbach-Leverkusen eG", group: "Volksbanken Raiffeisenbanken", blz: "37062600", keywords: ["bergisch gladbach", "51465", "GENODED1PAF"], unverified: true },
  
  { id: "vr-bank-mittelhaardt-eg", name: "VR Bank Mittelhaardt eG", group: "Volksbanken Raiffeisenbanken", blz: "54691200", keywords: ["bad dürkheim", "67098", "GENODE61DUW"], unverified: true },
  { id: "vr-bank-nord-eg", name: "VR Bank Nord eG", group: "Volksbanken Raiffeisenbanken", blz: "21763542", keywords: ["flensburg", "24937", "GENODEF1BDS"], unverified: true },
  { id: "vr-bank-waechtersbach-bad-soden-salmuenster-alt-eg", name: "VR Bank Wächtersbach/Bad Soden-Salmünster -alt eG", group: "Volksbanken Raiffeisenbanken", blz: "50794300", keywords: ["wächtersbach", "63607", "GENODE51WBH"], unverified: true },
  { id: "vr-plus-altmark-wendland-eg", name: "VR PLUS Altmark-Wendland eG", group: "Volksbanken Raiffeisenbanken", blz: "25863489", keywords: ["lüchow (wendland)", "29439", "GENODEF1WOT"], unverified: true },
  { id: "vr-bank-eg-2", name: "VR-Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "39162980", keywords: ["würselen", "52135", "GENODED1WUR"], unverified: true },
  { id: "vr-bank-altenburger-land-deutsche-skatbank-eg", name: "VR-Bank Altenburger Land / Deutsche Skatbank eG", group: "Volksbanken Raiffeisenbanken", blz: "83065408", keywords: ["schmölln", "04626", "GENODEF1SLR"], unverified: true },
  { id: "vr-bank-bad-salzungen-schmalkalden-gaa-eg", name: "VR-Bank Bad Salzungen Schmalkalden GAA eG", group: "Volksbanken Raiffeisenbanken", blz: "84094755", keywords: ["bad salzungen", "36433", "GENODEF1SAL"], unverified: true },
  { id: "vr-bank-bonn-rhein-sieg-eg-2", name: "VR-Bank Bonn Rhein-Sieg eG", group: "Volksbanken Raiffeisenbanken", blz: "37069520", keywords: ["siegburg", "53721", "GENODED1RST"], unverified: true },
  { id: "vr-bank-mittelsachsen-eg", name: "VR-Bank Mittelsachsen eG", group: "Volksbanken Raiffeisenbanken", blz: "86065468", keywords: ["freiberg", "09599", "GENODEF1DL1"], unverified: true },
  { id: "vr-bank-suedwestpfalz-pirmasens-zweibruecken-eg", name: "VR-Bank Südwestpfalz Pirmasens-Zweibrücken eG", group: "Volksbanken Raiffeisenbanken", blz: "54261700", keywords: ["pirmasens", "66953", "GENODE61ROA"], unverified: true },
  { id: "vr-bank-werdenfels-eg", name: "VR-Bank Werdenfels eG", group: "Volksbanken Raiffeisenbanken", blz: "70390010", keywords: ["garmisch-partenkirchen", "82467", "GENODEF1GAP"], unverified: true },
  { id: "vereinigte-raiffeisenbank-burgstaedt-eg", name: "Vereinigte Raiffeisenbank Burgstädt eG", group: "Volksbanken Raiffeisenbanken", blz: "87069077", keywords: ["burgstädt", "09217", "GENODEF1BST"], unverified: true },
  { id: "vereinigte-vr-bank-eg", name: "Vereinigte VR Bank eG", group: "Volksbanken Raiffeisenbanken", blz: "21791906", keywords: ["wyk auf föhr", "25938", "GENODEF1WYK"], unverified: true },
  { id: "vereinigte-volksbank-eg", name: "Vereinigte Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "28062249", keywords: ["hude", "27795", "GENODEF1HUD"], unverified: true },
  { id: "vereinigte-volksbank-bramgau-osnabrueck-wittlage-eg", name: "Vereinigte Volksbank Bramgau Osnabrück Wittlage eG", group: "Volksbanken Raiffeisenbanken", blz: "26590025", keywords: ["osnabrück", "49090", "GENODEF1OSV"], unverified: true },
  { id: "vereinigte-volksbank-gaa-eg", name: "Vereinigte Volksbank GAA eG", group: "Volksbanken Raiffeisenbanken", blz: "28062299", keywords: ["hude", "27798", "GENODEF1HUD"], unverified: true },
  { id: "vereinigte-volksbank-saarlouis-losheim-sulzbach-saar-eg", name: "Vereinigte Volksbank Saarlouis-Losheim-Sulzbach/Saar eG", group: "Volksbanken Raiffeisenbanken", blz: "59092000", keywords: ["saarlouis", "66740", "GENODE51SB2"], unverified: true },
  { id: "vereinte-volksbank-eg", name: "Vereinte Volksbank eG", group: "Volksbanken Raiffeisenbanken", blz: "42461435", keywords: ["dorsten", "46282", "GENODEM1KIH"], unverified: true },
  { id: "volks-und-raiffeisenbank-eg", name: "Volks- und Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "13061078", keywords: ["wismar", "23952", "GENODEF1HWI"], unverified: true },
  { id: "volks-und-raiffeisenbank-muldental-eg", name: "Volks- und Raiffeisenbank Muldental eG", group: "Volksbanken Raiffeisenbanken", blz: "86095484", keywords: ["grimma", "04668", "GENODEF1GMV"], unverified: true },
  { id: "volks-und-raiffeisenbank-saale-unstrut-eg", name: "Volks- und Raiffeisenbank Saale-Unstrut eG", group: "Volksbanken Raiffeisenbanken", blz: "80063648", keywords: ["merseburg", "06207", "GENODEF1NMB"], unverified: true },
  { id: "volksbank-aachen-sued-eg", name: "Volksbank Aachen Süd eG", group: "Volksbanken Raiffeisenbanken", blz: "39161490", keywords: ["aachen", "52037", "GENODED1AAS"], unverified: true },
  { id: "volksbank-ahlerstedt-eg", name: "Volksbank Ahlerstedt eG", group: "Volksbanken Raiffeisenbanken", blz: "20069780", keywords: ["ahlerstedt", "21702", "GENODEF1AST"], unverified: true },
  { id: "volksbank-aller-oker-eg", name: "Volksbank Aller-Oker eG", group: "Volksbanken Raiffeisenbanken", blz: "25069270", keywords: ["müden (aller)", "38539", "GENODEF1MUA"], unverified: true },
  { id: "volksbank-alzey-worms-eg", name: "Volksbank Alzey-Worms eG", group: "Volksbanken Raiffeisenbanken", blz: "55091200", keywords: ["worms", "67547", "GENODE61AZY"], unverified: true },
  { id: "volksbank-anroechte-eg", name: "Volksbank Anröchte eG", group: "Volksbanken Raiffeisenbanken", blz: "41661206", keywords: ["anröchte", "59604", "GENODEM1ANR"], unverified: true },
  { id: "volksbank-ascheberg-herbern-eg", name: "Volksbank Ascheberg-Herbern eG", group: "Volksbanken Raiffeisenbanken", blz: "40069601", keywords: ["ascheberg", "59381", "GENODEM1CAN"], unverified: true },
  { id: "volksbank-brawo-eg", name: "Volksbank BRAWO eG", group: "Volksbanken Raiffeisenbanken", blz: "26991066", keywords: ["wolfsburg", "38440", "GENODEF1WOB"], unverified: true },
  { id: "volksbank-bad-salzuflen-eg", name: "Volksbank Bad Salzuflen eG", group: "Volksbanken Raiffeisenbanken", blz: "48291490", keywords: ["bad salzuflen", "32108", "GENODEM1BSU"], unverified: true },
  { id: "volksbank-baumberge-eg", name: "Volksbank Baumberge eG", group: "Volksbanken Raiffeisenbanken", blz: "40069408", keywords: ["billerbeck", "48727", "GENODEM1BAU"], unverified: true },
  { id: "volksbank-berg-eg", name: "Volksbank Berg eG", group: "Volksbanken Raiffeisenbanken", blz: "37069125", keywords: ["wipperfürth", "51679", "GENODED1RKO"], unverified: true },
  { id: "volksbank-bocholt-eg", name: "Volksbank Bocholt eG", group: "Volksbanken Raiffeisenbanken", blz: "42860003", keywords: ["bocholt", "46395", "GENODEM1BOH"], unverified: true },
  { id: "volksbank-bochum-witten-eg", name: "Volksbank Bochum Witten eG", group: "Volksbanken Raiffeisenbanken", blz: "43060129", keywords: ["bochum", "44728", "GENODEM1BOC"], unverified: true },
  { id: "volksbank-bremen-nord-gf-gaa-eg", name: "Volksbank Bremen-Nord (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "29190399", keywords: ["bremen", "28757", "GENODEF1HB2"], unverified: true },
  { id: "volksbank-brueggen-nettetal-eg", name: "Volksbank Brüggen-Nettetal eG", group: "Volksbanken Raiffeisenbanken", blz: "31062154", keywords: ["brüggen", "41376", "GENODED1KBN"], unverified: true },
  { id: "volksbank-boenen-eg", name: "Volksbank Bönen eG", group: "Volksbanken Raiffeisenbanken", blz: "41062215", keywords: ["bönen", "59194", "GENODEM1BO1"], unverified: true },
  { id: "volksbank-boerde-bernburg-eg", name: "Volksbank Börde-Bernburg eG", group: "Volksbanken Raiffeisenbanken", blz: "81069052", keywords: ["wanzleben-börde", "39164", "GENODEF1WZL"], unverified: true },
  { id: "volksbank-chemnitz-eg", name: "Volksbank Chemnitz eG", group: "Volksbanken Raiffeisenbanken", blz: "87096214", keywords: ["chemnitz", "09003", "GENODEF1CH1"], unverified: true },
  { id: "volksbank-daaden-eg", name: "Volksbank Daaden eG", group: "Volksbanken Raiffeisenbanken", blz: "57391200", keywords: ["daaden", "57567", "GENODE51DAA"], unverified: true },
  { id: "volksbank-delbrueck-rietberg-eg", name: "Volksbank Delbrück-Rietberg eG", group: "Volksbanken Raiffeisenbanken", blz: "47862447", keywords: ["delbrück", "33129", "GENODEM1RNE"], unverified: true },
  { id: "volksbank-delitzsch-eg", name: "Volksbank Delitzsch eG", group: "Volksbanken Raiffeisenbanken", blz: "86095554", keywords: ["delitzsch", "04509", "GENODEF1DZ1"], unverified: true },
  { id: "volksbank-dessau-anhalt-eg", name: "Volksbank Dessau-Anhalt eG", group: "Volksbanken Raiffeisenbanken", blz: "80093574", keywords: ["dessau-roßlau", "06811", "GENODEF1DS1"], unverified: true },
  { id: "volksbank-dinslaken-eg", name: "Volksbank Dinslaken eG", group: "Volksbanken Raiffeisenbanken", blz: "35261248", keywords: ["dinslaken", "46525", "GENODED1DLK"], unverified: true },
  { id: "volksbank-dresden-bautzen-eg", name: "Volksbank Dresden-Bautzen eG", group: "Volksbanken Raiffeisenbanken", blz: "85090000", keywords: ["dresden", "01097", "GENODEF1DRS"], unverified: true },
  { id: "volksbank-duennwald-holweide-eg", name: "Volksbank Dünnwald-Holweide eG", group: "Volksbanken Raiffeisenbanken", blz: "37069427", keywords: ["köln", "51069", "GENODED1DHK"], unverified: true },
  { id: "volksbank-duesseldorf-neuss-eg", name: "Volksbank Düsseldorf Neuss eG", group: "Volksbanken Raiffeisenbanken", blz: "30160213", keywords: ["düsseldorf", "40012", "GENODED1DNE"], unverified: true },
  { id: "volksbank-duesseldorf-neuss-gf-gaa-eg", name: "Volksbank Düsseldorf Neuss (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "30160266", keywords: ["düsseldorf", "40215", "GENODED1DNE"], unverified: true },
  { id: "volksbank-eisenberg-eg", name: "Volksbank Eisenberg eG", group: "Volksbanken Raiffeisenbanken", blz: "83094494", keywords: ["eisenberg", "07607", "GENODEF1ESN"], unverified: true },
  { id: "volksbank-elsen-wewer-borchen-eg", name: "Volksbank Elsen-Wewer-Borchen eG", group: "Volksbanken Raiffeisenbanken", blz: "47260234", keywords: ["paderborn", "33075", "GENODEM1EWB"], unverified: true },
  { id: "volksbank-emmerich-rees-eg", name: "Volksbank Emmerich-Rees eG", group: "Volksbanken Raiffeisenbanken", blz: "35860245", keywords: ["emmerich am rhein", "46427", "GENODED1EMR"], unverified: true },
  { id: "volksbank-enniger-ostenfelde-westkirchen-eg", name: "Volksbank Enniger-Ostenfelde-Westkirchen eG", group: "Volksbanken Raiffeisenbanken", blz: "41261324", keywords: ["ennigerloh", "59320", "GENODEM1EOW"], unverified: true },
  { id: "volksbank-erft-eg", name: "Volksbank Erft eG", group: "Volksbanken Raiffeisenbanken", blz: "37069252", keywords: ["elsdorf", "50183", "GENODED1ERE"], unverified: true },
  { id: "volksbank-euskirchen-eg", name: "Volksbank Euskirchen eG", group: "Volksbanken Raiffeisenbanken", blz: "38260082", keywords: ["euskirchen", "53879", "GENODED1EVB"], unverified: true },
  { id: "volksbank-eutin-raiffeisenbank-eg", name: "Volksbank Eutin Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "21392218", keywords: ["eutin", "23693", "GENODEF1EUT"], unverified: true },
  { id: "volksbank-gebhardshain-eg", name: "Volksbank Gebhardshain eG", group: "Volksbanken Raiffeisenbanken", blz: "57361476", keywords: ["gebhardshain", "57580", "GENODED1GBS"], unverified: true },
  { id: "volksbank-gera-jena-rudolstadt-eg", name: "Volksbank Gera-Jena-Rudolstadt eG", group: "Volksbanken Raiffeisenbanken", blz: "83094454", keywords: ["jena", "07743", "GENODEF1RUJ"], unverified: true },
  { id: "volksbank-gersprenztal-otzberg-eg", name: "Volksbank Gersprenztal-Otzberg eG", group: "Volksbanken Raiffeisenbanken", blz: "50862703", keywords: ["reinheim", "64354", "GENODE51REI"], unverified: true },
  { id: "volksbank-gescher-eg", name: "Volksbank Gescher eG", group: "Volksbanken Raiffeisenbanken", blz: "40164901", keywords: ["gescher", "48712", "GENODEM1GE1"], unverified: true },
  { id: "volksbank-glan-muenchweiler-eg", name: "Volksbank Glan-Münchweiler eG", group: "Volksbanken Raiffeisenbanken", blz: "54092400", keywords: ["glan-münchweiler", "66905", "GENODE61GLM"], unverified: true },
  { id: "volksbank-grevenbrueck-alt-eg", name: "Volksbank Grevenbrück -alt eG", group: "Volksbanken Raiffeisenbanken", blz: "46261607", keywords: ["lennestadt", "57368", "GENODEM1GLG"], unverified: true },
  { id: "volksbank-gronau-ahaus-eg", name: "Volksbank Gronau-Ahaus eG", group: "Volksbanken Raiffeisenbanken", blz: "40164024", keywords: ["gronau (westf.)", "48599", "GENODEM1GRN"], unverified: true },
  { id: "volksbank-halle-saale-eg", name: "Volksbank Halle, Saale eG", group: "Volksbanken Raiffeisenbanken", blz: "80093784", keywords: ["halle (saale)", "06016", "GENODEF1HAL"], unverified: true },
  { id: "volksbank-halle-westf-eg", name: "Volksbank Halle/Westf eG", group: "Volksbanken Raiffeisenbanken", blz: "48062051", keywords: ["halle (westf.)", "33790", "GENODEM1HLW"], unverified: true },
  { id: "volksbank-hamm-sieg-eg", name: "Volksbank Hamm/Sieg eG", group: "Volksbanken Raiffeisenbanken", blz: "57391500", keywords: ["hamm", "57573", "GENODE51HAM"], unverified: true },
  { id: "volksbank-heiden-eg", name: "Volksbank Heiden eG", group: "Volksbanken Raiffeisenbanken", blz: "42861608", keywords: ["heiden", "46356", "GENODEM1HEI"], unverified: true },
  { id: "volksbank-heimbach-eg", name: "Volksbank Heimbach eG", group: "Volksbanken Raiffeisenbanken", blz: "37069342", keywords: ["heimbach", "52396", "GENODED1HMB"], unverified: true },
  { id: "volksbank-heinsberg-eg", name: "Volksbank Heinsberg eG", group: "Volksbanken Raiffeisenbanken", blz: "37069412", keywords: ["heinsberg", "52525", "GENODED1HRB"], unverified: true },
  
  { id: "volksbank-hellweg-eg", name: "Volksbank Hellweg eG", group: "Volksbanken Raiffeisenbanken", blz: "41460116", keywords: ["soest", "59494", "GENODEM1SOE"], unverified: true },
  { id: "volksbank-hildesheim-eg", name: "Volksbank Hildesheim eG", group: "Volksbanken Raiffeisenbanken", blz: "25990011", keywords: ["hildesheim", "31113", "GENODEF1HIH"], unverified: true },
  { id: "volksbank-hohenlimburg-eg", name: "Volksbank Hohenlimburg eG", group: "Volksbanken Raiffeisenbanken", blz: "45061524", keywords: ["hagen", "58119", "GENODEM1HLH"], unverified: true },
  { id: "volksbank-jade-weser-eg", name: "Volksbank Jade-Weser eG", group: "Volksbanken Raiffeisenbanken", blz: "28262673", keywords: ["varel", "26316", "GENODEF1VAR"], unverified: true },
  { id: "volksbank-jerichower-land-eg", name: "Volksbank Jerichower Land eG", group: "Volksbanken Raiffeisenbanken", blz: "81063238", keywords: ["burg", "39288", "GENODEF1BRG"], unverified: true },
  { id: "volksbank-kaiserslautern-eg", name: "Volksbank Kaiserslautern eG", group: "Volksbanken Raiffeisenbanken", blz: "54090000", keywords: ["kaiserslautern", "67655", "GENODE61KL1"], unverified: true },
  
  { id: "volksbank-kempen-grefrath-eg", name: "Volksbank Kempen-Grefrath eG", group: "Volksbanken Raiffeisenbanken", blz: "32061414", keywords: ["kempen", "47885", "GENODED1KMP"], unverified: true },
  { id: "volksbank-kierspe-eg", name: "Volksbank Kierspe eG", group: "Volksbanken Raiffeisenbanken", blz: "45861434", keywords: ["kierspe", "58566", "GENODEM1KIE"], unverified: true },
  { id: "volksbank-kleverland-eg", name: "Volksbank Kleverland eG", group: "Volksbanken Raiffeisenbanken", blz: "32460422", keywords: ["kleve", "47533", "GENODED1KLL"], unverified: true },
  { id: "volksbank-koeln-bonn-eg", name: "Volksbank Köln Bonn eG", group: "Volksbanken Raiffeisenbanken", blz: "38060186", keywords: ["bonn", "53252", "GENODED1BRS"], unverified: true },
  { id: "volksbank-lastrup-eg", name: "Volksbank Lastrup eG", group: "Volksbanken Raiffeisenbanken", blz: "28067257", keywords: ["lastrup", "49688", "GENODEF1LAP"], unverified: true },
  { id: "volksbank-lauterecken-eg", name: "Volksbank Lauterecken eG", group: "Volksbanken Raiffeisenbanken", blz: "54091700", keywords: ["lauterecken", "67742", "GENODE61LEK"], unverified: true },
  { id: "volksbank-lette-darup-rorup-eg", name: "Volksbank Lette-Darup-Rorup eG", group: "Volksbanken Raiffeisenbanken", blz: "40069226", keywords: ["coesfeld", "48645", "GENODEM1CND"], unverified: true },
  { id: "volksbank-lohne-dinklage-steinfeld-muehlen-eg", name: "Volksbank Lohne-Dinklage-Steinfeld-Mühlen eG", group: "Volksbanken Raiffeisenbanken", blz: "28062560", keywords: ["lohne (oldenburg)", "49379", "GENODEF1LON"], unverified: true },
  { id: "volksbank-loebau-zittau-eg", name: "Volksbank Löbau-Zittau eG", group: "Volksbanken Raiffeisenbanken", blz: "85590100", keywords: ["ebersbach-neugersdorf", "02727", "GENODEF1NGS"], unverified: true },
  { id: "volksbank-loeningen-eg", name: "Volksbank Löningen eG", group: "Volksbanken Raiffeisenbanken", blz: "28065061", keywords: ["löningen", "49619", "GENODEF1LOG"], unverified: true },
  { id: "volksbank-luebeck-eg", name: "Volksbank Lübeck eG", group: "Volksbanken Raiffeisenbanken", blz: "23090142", keywords: ["lübeck", "23552", "GENODEF1HLU"], unverified: true },
  { id: "volksbank-lueneburger-heide-eg", name: "Volksbank Lüneburger Heide eG", group: "Volksbanken Raiffeisenbanken", blz: "24060300", keywords: ["winsen (luhe)", "21412", "GENODEF1NBU"], unverified: true },
  { id: "volksbank-magdeburg-eg", name: "Volksbank Magdeburg eG", group: "Volksbanken Raiffeisenbanken", blz: "81093274", keywords: ["magdeburg", "39104", "GENODEF1MD1"], unverified: true },
  { id: "volksbank-marl-recklinghausen-eg", name: "Volksbank Marl-Recklinghausen eG", group: "Volksbanken Raiffeisenbanken", blz: "42661008", keywords: ["marl", "45752", "GENODEM1MRL"], unverified: true },
  { id: "volksbank-marl-recklinghausen-gf-gaa-eg", name: "Volksbank Marl-Recklinghausen (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "42661088", keywords: ["marl", "45772", "GENODEM1MRL"], unverified: true },
  { id: "volksbank-mittleres-erzgebirge-eg", name: "Volksbank Mittleres Erzgebirge eG", group: "Volksbanken Raiffeisenbanken", blz: "87069075", keywords: ["olbernhau", "09526", "GENODEF1MBG"], unverified: true },
  { id: "volksbank-mittweida-eg", name: "Volksbank Mittweida eG", group: "Volksbanken Raiffeisenbanken", blz: "87096124", keywords: ["mittweida", "09648", "GENODEF1MIW"], unverified: true },
  { id: "volksbank-moenchengladbach-eg", name: "Volksbank Mönchengladbach eG", group: "Volksbanken Raiffeisenbanken", blz: "31060517", keywords: ["mönchengladbach", "41241", "GENODED1MRB"], unverified: true },
  { id: "volksbank-niedergrafschaft-eg", name: "Volksbank Niedergrafschaft eG", group: "Volksbanken Raiffeisenbanken", blz: "28069926", keywords: ["uelsen", "49843", "GENODEF1HOO"], unverified: true },
  { id: "volksbank-niederrhein-eg", name: "Volksbank Niederrhein eG", group: "Volksbanken Raiffeisenbanken", blz: "35461106", keywords: ["alpen", "46515", "GENODED1NRH"], unverified: true },
  { id: "volksbank-niedersachsen-mitte-gf-gaa-eg", name: "Volksbank Niedersachsen-Mitte (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "25691699", keywords: ["hoya", "27318", "GENODEF1SUL"], unverified: true },
  { id: "volksbank-nottuln-eg", name: "Volksbank Nottuln eG", group: "Volksbanken Raiffeisenbanken", blz: "40164352", keywords: ["nottuln", "48301", "GENODEM1CNO"], unverified: true },
  { id: "volksbank-oberberg-eg", name: "Volksbank Oberberg eG", group: "Volksbanken Raiffeisenbanken", blz: "38462135", keywords: ["wiehl", "51674", "GENODED1WIL"], unverified: true },
  { id: "volksbank-ochtrup-laer-eg", name: "Volksbank Ochtrup-Laer eG", group: "Volksbanken Raiffeisenbanken", blz: "40164618", keywords: ["ochtrup", "48602", "GENODEM1OTR"], unverified: true },
  { id: "volksbank-oldenburg-land-delmenhorst-eg", name: "Volksbank Oldenburg-Land Delmenhorst eG", group: "Volksbanken Raiffeisenbanken", blz: "28066214", keywords: ["wildeshausen", "27793", "GENODEF1WDH"], unverified: true },
  { id: "volksbank-olpe-wenden-drolshagen-eg", name: "Volksbank Olpe-Wenden-Drolshagen eG", group: "Volksbanken Raiffeisenbanken", blz: "46261822", keywords: ["olpe", "57450", "GENODEM1WDD"], unverified: true },
  { id: "volksbank-ostlippe-eg", name: "Volksbank Ostlippe eG", group: "Volksbanken Raiffeisenbanken", blz: "47691200", keywords: ["blomberg", "32820", "GENODEM1OLB"], unverified: true },
  { id: "volksbank-oyten-eg", name: "Volksbank Oyten eG", group: "Volksbanken Raiffeisenbanken", blz: "29165545", keywords: ["oyten", "28871", "GENODEF1OYT"], unverified: true },
  { id: "volksbank-plus-eg", name: "Volksbank PLUS eG", group: "Volksbanken Raiffeisenbanken", blz: "49092650", keywords: ["lübbecke", "32312", "GENODEM1LUB"], unverified: true },
  { id: "volksbank-pirna-eg", name: "Volksbank Pirna eG", group: "Volksbanken Raiffeisenbanken", blz: "85060000", keywords: ["pirna", "01796", "GENODEF1PR2"], unverified: true },
  { id: "volksbank-raesfeld-und-erle-eg", name: "Volksbank Raesfeld und Erle eG", group: "Volksbanken Raiffeisenbanken", blz: "42862451", keywords: ["raesfeld", "46348", "GENODEM1RAE"], unverified: true },
  { id: "volksbank-raiffeisenbank-eg", name: "Volksbank Raiffeisenbank eG", group: "Volksbanken Raiffeisenbanken", blz: "20190109", keywords: ["bad oldesloe", "23843", "GENODEF1HH4"], unverified: true },
  { id: "volksbank-raiffeisenbank-dachau-gf-gaa-eg", name: "Volksbank Raiffeisenbank Dachau (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "70091510", keywords: ["dachau", "85221", "GENODEF1DCA"], unverified: true },
  { id: "volksbank-raiffeisenbank-hanau-ndl-d-frankf-vb-eg", name: "Volksbank Raiffeisenbank Hanau Ndl d Frankf VB eG", group: "Volksbanken Raiffeisenbanken", blz: "50690000", keywords: ["hanau", "63412", "GENODEF1HUV"], unverified: true },
  { id: "volksbank-raiffeisenbank-meissen-grossenhain-eg", name: "Volksbank Raiffeisenbank Meißen Großenhain eG", group: "Volksbanken Raiffeisenbanken", blz: "85095004", keywords: ["meißen", "01652", "GENODEF1MEI"], unverified: true },
  { id: "volksbank-raiffeisenbank-niederschlesien-eg", name: "Volksbank Raiffeisenbank Niederschlesien eG", group: "Volksbanken Raiffeisenbanken", blz: "85591000", keywords: ["görlitz", "02810", "GENODEF1GR1"], unverified: true },
  { id: "volksbank-rhede-eg", name: "Volksbank Rhede eG", group: "Volksbanken Raiffeisenbanken", blz: "42861814", keywords: ["rhede", "46407", "GENODEM1RHD"], unverified: true },
  { id: "volksbank-rhein-erft-koeln-eg", name: "Volksbank Rhein-Erft-Köln eG", group: "Volksbanken Raiffeisenbanken", blz: "37062365", keywords: ["hürth", "50354", "GENODED1FHH"], unverified: true },
  { id: "volksbank-rhein-lahn-limburg-eg", name: "Volksbank Rhein-Lahn-Limburg eG", group: "Volksbanken Raiffeisenbanken", blz: "57092800", keywords: ["diez", "65582", "GENODE51DIE"], unverified: true },
  { id: "volksbank-rhein-lippe-eg", name: "Volksbank Rhein-Lippe eG", group: "Volksbanken Raiffeisenbanken", blz: "35660599", keywords: ["wesel", "46465", "GENODED1RLW"], unverified: true },
  
  { id: "volksbank-rhein-nahe-hunsrueck-eg", name: "Volksbank Rhein-Nahe-Hunsrück eG", group: "Volksbanken Raiffeisenbanken", blz: "56090000", keywords: ["bad kreuznach", "55543", "GENODE51KRE"], unverified: true },
  { id: "volksbank-rhein-ruhr-eg", name: "Volksbank Rhein-Ruhr eG", group: "Volksbanken Raiffeisenbanken", blz: "35060386", keywords: ["duisburg", "47013", "GENODED1VRR"], unverified: true },
  { id: "volksbank-rheinahreifel-gf-gaa-eg", name: "Volksbank RheinAhrEifel (Gf GAA) eG", group: "Volksbanken Raiffeisenbanken", blz: "57761599", keywords: ["koblenz", "56068", "GENODED1BNA"], unverified: true },
  { id: "volksbank-rheinboellen-eg", name: "Volksbank Rheinböllen eG", group: "Volksbanken Raiffeisenbanken", blz: "56062227", keywords: ["rheinböllen", "55492", "GENODED1RBO"], unverified: true },
  { id: "volksbank-riesa-eg", name: "Volksbank Riesa eG", group: "Volksbanken Raiffeisenbanken", blz: "85094984", keywords: ["riesa", "01587", "GENODEF1RIE"], unverified: true },
  { id: "volksbank-ruhr-mitte-eg", name: "Volksbank Ruhr Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "42260001", keywords: ["gelsenkirchen", "45877", "GENODEM1GBU"], unverified: true },
  { id: "volksbank-sauerland-eg", name: "Volksbank Sauerland eG", group: "Volksbanken Raiffeisenbanken", blz: "46062817", keywords: ["schmallenberg", "57392", "GENODEM1SMA"], unverified: true },
  { id: "volksbank-schermbeck-eg", name: "Volksbank Schermbeck eG", group: "Volksbanken Raiffeisenbanken", blz: "40069363", keywords: ["schermbeck", "46510", "GENODEM1SMB"], unverified: true },
  { id: "volksbank-schlangen-eg", name: "Volksbank Schlangen eG", group: "Volksbanken Raiffeisenbanken", blz: "40069283", keywords: ["schlangen", "33185", "GENODEM1SLN"], unverified: true },
  { id: "volksbank-schwalmtal-eg", name: "Volksbank Schwalmtal eG", group: "Volksbanken Raiffeisenbanken", blz: "31062553", keywords: ["niederkrüchten", "41372", "GENODED1NKR"], unverified: true },
  { id: "volksbank-schwanewede-eg", name: "Volksbank Schwanewede eG", group: "Volksbanken Raiffeisenbanken", blz: "29162453", keywords: ["schwanewede", "28784", "GENODEF1SWW"], unverified: true },
  { id: "volksbank-selm-bork-eg", name: "Volksbank Selm-Bork eG", group: "Volksbanken Raiffeisenbanken", blz: "40165366", keywords: ["selm", "59379", "GENODEM1SEM"], unverified: true },
  { id: "volksbank-senden-eg", name: "Volksbank Senden eG", group: "Volksbanken Raiffeisenbanken", blz: "40069546", keywords: ["senden", "48308", "GENODEM1SDN"], unverified: true },
  { id: "volksbank-sprockhoevel-eg", name: "Volksbank Sprockhövel eG", group: "Volksbanken Raiffeisenbanken", blz: "45261547", keywords: ["sprockhövel", "45538", "GENODEM1SPO"], unverified: true },
  { id: "volksbank-stade-cuxhaven-eg", name: "Volksbank Stade-Cuxhaven eG", group: "Volksbanken Raiffeisenbanken", blz: "24191015", keywords: ["stade", "21661", "GENODEF1SDE"], unverified: true },
  { id: "volksbank-stendal-eg", name: "Volksbank Stendal eG", group: "Volksbanken Raiffeisenbanken", blz: "81093054", keywords: ["stendal", "39576", "GENODEF1SDL"], unverified: true },
  { id: "volksbank-stoermede-westenholz-hoerste-eg", name: "Volksbank Störmede-Westenholz-Hörste eG", group: "Volksbanken Raiffeisenbanken", blz: "41662465", keywords: ["delbrück", "33129", "GENODEM1SGE"], unverified: true },
  { id: "volksbank-sued-emsland-eg", name: "Volksbank Süd-Emsland eG", group: "Volksbanken Raiffeisenbanken", blz: "28069994", keywords: ["spelle", "48480", "GENODEF1SPL"], unverified: true },
  { id: "volksbank-suedkirchen-capelle-nordkirchen-eg", name: "Volksbank Südkirchen-Capelle-Nordkirchen eG", group: "Volksbanken Raiffeisenbanken", blz: "40069716", keywords: ["nordkirchen", "59394", "GENODEM1SCN"], unverified: true },
  { id: "volksbank-thueringen-mitte-eg", name: "Volksbank Thüringen Mitte eG", group: "Volksbanken Raiffeisenbanken", blz: "84094814", keywords: ["erfurt", "99084", "GENODEF1SHL"], unverified: true },
  { id: "volksbank-trier-eifel-eg", name: "Volksbank Trier Eifel eG", group: "Volksbanken Raiffeisenbanken", blz: "58660101", keywords: ["trier", "54292", "GENODED1BIT"], unverified: true },
  { id: "volksbank-uelzen-salzwedel-eg", name: "Volksbank Uelzen-Salzwedel eG", group: "Volksbanken Raiffeisenbanken", blz: "25862292", keywords: ["uelzen", "29525", "GENODEF1EUB"], unverified: true },
  
  { id: "volksbank-vechta-eg", name: "Volksbank Vechta eG", group: "Volksbanken Raiffeisenbanken", blz: "28064179", keywords: ["vechta", "49364", "GENODEF1VEC"], unverified: true },
  { id: "volksbank-versmold-eg", name: "Volksbank Versmold eG", group: "Volksbanken Raiffeisenbanken", blz: "47863373", keywords: ["versmold", "33762", "GENODEM1VMD"], unverified: true },
  { id: "volksbank-viersen-eg", name: "Volksbank Viersen eG", group: "Volksbanken Raiffeisenbanken", blz: "31460290", keywords: ["viersen", "41730", "GENODED1VSN"], unverified: true },
  { id: "volksbank-visbek-eg", name: "Volksbank Visbek eG", group: "Volksbanken Raiffeisenbanken", blz: "28066103", keywords: ["visbek", "49425", "GENODEF1VIS"], unverified: true },
  { id: "volksbank-vogtland-gaa-eg", name: "Volksbank Vogtland GAA eG", group: "Volksbanken Raiffeisenbanken", blz: "87095899", keywords: ["plauen", "08525", "GENODEF1EXT"], unverified: true },
  { id: "volksbank-vogtland-saale-orla-eg", name: "Volksbank Vogtland-Saale-Orla eG", group: "Volksbanken Raiffeisenbanken", blz: "87095824", keywords: ["plauen", "08525", "GENODEF1PL1"], unverified: true },
  { id: "volksbank-westerstede-eg", name: "Volksbank Westerstede eG", group: "Volksbanken Raiffeisenbanken", blz: "28063253", keywords: ["westerstede", "26655", "GENODEF1WRE"], unverified: true },
  { id: "volksbank-westmuensterland-eg", name: "Volksbank Westmünsterland eG", group: "Volksbanken Raiffeisenbanken", blz: "42861387", keywords: ["coesfeld", "48653", "GENODEM1BOB"], unverified: true },
  { id: "volksbank-westrhauderfehn-eg", name: "Volksbank Westrhauderfehn eG", group: "Volksbanken Raiffeisenbanken", blz: "28591654", keywords: ["rhauderfehn", "26817", "GENODEF1WRH"], unverified: true },
  { id: "volksbank-wilhelmshaven-eg", name: "Volksbank Wilhelmshaven eG", group: "Volksbanken Raiffeisenbanken", blz: "28290063", keywords: ["wilhelmshaven", "26382", "GENODEF1WHV"], unverified: true },
  { id: "volksbank-winsener-marsch-eg", name: "Volksbank Winsener Marsch eG", group: "Volksbanken Raiffeisenbanken", blz: "20069965", keywords: ["marschacht", "21436", "GENODEF1WIM"], unverified: true },
  { id: "volksbank-wipperfuerth-lindlar-eg", name: "Volksbank Wipperfürth-Lindlar eG", group: "Volksbanken Raiffeisenbanken", blz: "37069840", keywords: ["wipperfürth", "51688", "GENODED1WPF"], unverified: true },
  { id: "volksbank-wittenberg-eg", name: "Volksbank Wittenberg eG", group: "Volksbanken Raiffeisenbanken", blz: "80063598", keywords: ["lutherstadt wittenberg", "06886", "GENODEF1WB1"], unverified: true },
  { id: "volksbank-wittgenstein-eg", name: "Volksbank Wittgenstein eG", group: "Volksbanken Raiffeisenbanken", blz: "46063405", keywords: ["bad berleburg", "57306", "GENODEM1BB1"], unverified: true },
  { id: "volksbank-zwickau-eg", name: "Volksbank Zwickau eG", group: "Volksbanken Raiffeisenbanken", blz: "87095934", keywords: ["zwickau", "08056", "GENODEF1Z01"], unverified: true },
  { id: "volksbank-an-der-niers-eg", name: "Volksbank an der Niers eG", group: "Volksbanken Raiffeisenbanken", blz: "32061384", keywords: ["kevelaer", "47623", "GENODED1GDL"], unverified: true },
  { id: "volksbank-im-harz-eg", name: "Volksbank im Harz eG", group: "Volksbanken Raiffeisenbanken", blz: "26891484", keywords: ["osterode am harz", "37504", "GENODEF1OHA"], unverified: true },
  { id: "volksbank-im-hochsauerland-eg", name: "Volksbank im Hochsauerland eG", group: "Volksbanken Raiffeisenbanken", blz: "40069266", keywords: ["eslohe (sauerland)", "59889", "GENODEM1MAS"], unverified: true },
  { id: "volksbank-im-muensterland-eg", name: "Volksbank im Münsterland eG", group: "Volksbanken Raiffeisenbanken", blz: "40361906", keywords: ["münster", "48143", "GENODEM1IBB"], unverified: true },
  { id: "volksbank-in-ostwestfalen-guetersloh-eg", name: "Volksbank in Ostwestfalen, Gütersloh eG", group: "Volksbanken Raiffeisenbanken", blz: "47860125", keywords: ["bielefeld", "33602", "GENODEM1GTL"], unverified: true },
  { id: "volksbank-in-schaumburg-und-nienburg-eg", name: "Volksbank in Schaumburg und Nienburg eG", group: "Volksbanken Raiffeisenbanken", blz: "25591413", keywords: ["rinteln", "31737", "GENODEF1BCK"], unverified: true },
  { id: "volksbank-in-suedwestfalen-eg", name: "Volksbank in Südwestfalen eG", group: "Volksbanken Raiffeisenbanken", blz: "44761534", keywords: ["siegen", "57072", "GENODEM1NRD"], unverified: true },
  { id: "volksbank-in-der-hohen-mark-eg", name: "Volksbank in der Hohen Mark eG", group: "Volksbanken Raiffeisenbanken", blz: "40069709", keywords: ["reken", "48734", "GENODEM1DLR"], unverified: true },
  { id: "volksbank-raiffeisenbank-glauchau-eg", name: "Volksbank-Raiffeisenbank Glauchau eG", group: "Volksbanken Raiffeisenbanken", blz: "87095974", keywords: ["glauchau", "08371", "GENODEF1GC1"], unverified: true },

];

// ─── Synonyme ───────────────────────────────────────────────────────────
const synonyms: Record<string, string[]> = {
  "vr": ["volksbank", "raiffeisenbank", "volksbanken raiffeisenbanken"],
  "vb": ["volksbank"],
  "rb": ["raiffeisenbank"],
  "raiffeisen": ["raiffeisenbank"],
  "volks": ["volksbank"],
  "sparda": ["sparda bank", "sparda-bank"],
  "psd": ["psd bank"],
  "gls": ["gls gemeinschaftsbank", "gls bank"],
  "bb": ["bbbank"],
};

function expandSynonyms(word: string): string[] {
  const expanded = synonyms[word];
  return expanded ? expanded : [word];
}

// ─── Normalisierung ─────────────────────────────────────────────────────
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

// ─── Levenshtein ────────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

// ─── Trigram similarity ─────────────────────────────────────────────────
function trigrams(str: string): Set<string> {
  const padded = `  ${str} `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    set.add(padded.slice(i, i + 3));
  }
  return set;
}

function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersection = 0;
  ta.forEach((t) => { if (tb.has(t)) intersection++; });
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Build searchable text for each bank ────────────────────────────────
function getBankSearchTexts(bank: Bank): string[] {
  const texts = [normalize(bank.name), normalize(bank.group)];
  if (bank.aliases) for (const a of bank.aliases) texts.push(normalize(a));
  if (bank.keywords) for (const k of bank.keywords) texts.push(normalize(k));
  return texts;
}

// ─── Search result type ─────────────────────────────────────────────────
export interface SearchResult {
  banks: Bank[];
  suggestion?: string;
}

// ─── PLZ lookup ─────────────────────────────────────────────────────────
import { plzToCity } from "./plz-mapping";

function lookupPlz(query: string): string[] {
  const q = query.replace(/\s/g, "");
  if (!/^\d{3,5}$/.test(q)) return [];
  // Exact match
  if (plzToCity[q]) return plzToCity[q];
  // Prefix match (for partial PLZ input like "722")
  const matches: string[] = [];
  const seen = new Set<string>();
  for (const [plz, cities] of Object.entries(plzToCity)) {
    if (plz.startsWith(q)) {
      for (const c of cities) {
        if (!seen.has(c)) { seen.add(c); matches.push(c); }
      }
    }
  }
  return matches;
}

// ─── Main search ────────────────────────────────────────────────────────
export function searchBanks(query: string): SearchResult {
  if (!query.trim()) return { banks: [] };

  const rawQuery = query.trim();

  // PLZ-based search: if query looks like a PLZ, find banks by city
  const plzCities = lookupPlz(rawQuery);
  if (plzCities.length > 0) {
    type ScoredBank = { bank: Bank; score: number };
    const scored: ScoredBank[] = [];
    for (const bank of banks) {
      const bankKeywords = (bank.keywords || []).map((k) => k.toLowerCase());
      for (const city of plzCities) {
        const cityNorm = city.toLowerCase();
        const idx = bankKeywords.findIndex((kw) => kw === cityNorm || kw.includes(cityNorm) || cityNorm.includes(kw));
        if (idx >= 0) {
          scored.push({ bank, score: idx });
          break;
        }
      }
    }
    scored.sort((a, b) => a.score - b.score);
    if (scored.length > 0) {
      return { banks: scored.map((s) => s.bank) };
    }
  }

  const normalizedQuery = normalize(rawQuery);
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  // For each query word, collect synonym phrases (not split into individual words)
  const expandedPhrases = queryWords.map((w) =>
    [w, ...expandSynonyms(w).map(normalize)]
  );

  type ScoredBank = { bank: Bank; score: number };
  const scored: ScoredBank[] = [];

  for (const bank of banks) {
    const blz = bank.blz || "";
    const searchTexts = getBankSearchTexts(bank);
    const allText = searchTexts.join(" ");
    const allWords = allText.split(/\s+/);

    // BLZ match
    if (blz === rawQuery || blz.startsWith(rawQuery)) {
      scored.push({ bank, score: blz === rawQuery ? 0 : 0.5 });
      continue;
    }

    let totalScore = 0;
    let allMatch = true;

    for (const phrases of expandedPhrases) {
      let bestWordScore = Infinity;

      for (const phrase of phrases) {
        // Full phrase substring match
        if (allText.includes(phrase)) {
          const idx = allText.indexOf(phrase);
          bestWordScore = Math.min(bestWordScore, 1 + idx * 0.001);
          continue;
        }
        // Single-word matching only for single words (not multi-word synonym phrases)
        const phraseWords = phrase.split(/\s+/);
        if (phraseWords.length === 1) {
          const word = phraseWords[0];
          for (const nw of allWords) {
            if (nw.startsWith(word) || word.startsWith(nw)) {
              bestWordScore = Math.min(bestWordScore, 2);
            }
          }
          for (const nw of allWords) {
            const d = levenshtein(word, nw.slice(0, word.length + 2));
            const threshold = Math.max(1, Math.floor(word.length / 3));
            if (d <= threshold) {
              bestWordScore = Math.min(bestWordScore, 3 + d);
            }
          }
        }
      }

      if (bestWordScore === Infinity) {
        allMatch = false;
        break;
      }
      totalScore += bestWordScore;
    }

    if (allMatch) {
      scored.push({ bank, score: totalScore });
    }
  }

  scored.sort((a, b) => a.score - b.score);

  if (scored.length === 0) {
    const trigramScored: ScoredBank[] = [];
    for (const bank of banks) {
      const allText = getBankSearchTexts(bank).join(" ");
      const sim = trigramSimilarity(normalizedQuery, allText);
      if (sim > 0.15) {
        trigramScored.push({ bank, score: 100 - sim * 100 });
      }
    }
    trigramScored.sort((a, b) => a.score - b.score);

    if (trigramScored.length > 0) {
      return {
        banks: trigramScored.map((s) => s.bank),
        suggestion: trigramScored[0].bank.name,
      };
    }

    const partialScored: ScoredBank[] = [];
    for (const bank of banks) {
      const allText = getBankSearchTexts(bank).join(" ");
      const allWords = allText.split(/\s+/);
      for (const phrases of expandedPhrases) {
        for (const phrase of phrases) {
          const phraseWords = phrase.split(/\s+/);
          if (phraseWords.length > 1) continue;
          const word = phraseWords[0];
          for (const nw of allWords) {
            const d = levenshtein(word, nw.slice(0, word.length + 3));
            if (d <= Math.max(2, Math.floor(word.length / 2))) {
              if (!partialScored.some((s) => s.bank.id === bank.id)) {
                partialScored.push({ bank, score: 50 + d });
              }
              break;
            }
          }
          if (partialScored.some((s) => s.bank.id === bank.id)) break;
        }
        if (partialScored.some((s) => s.bank.id === bank.id)) break;
      }
    }
    partialScored.sort((a, b) => a.score - b.score);

    return {
      banks: partialScored.map((s) => s.bank),
      suggestion: partialScored.length > 0 ? partialScored[0].bank.name : undefined,
    };
  }

  return { banks: scored.map((s) => s.bank) };
}