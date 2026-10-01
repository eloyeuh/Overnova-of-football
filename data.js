// ===== DONNÉES =====
// Effectifs 2026-27 : composition, âges et entraîneurs d'après fussballdaten.de (octobre 2026) ;
// notes EA SPORTS FC 27 d'après fcratings.com. Potentiel estimé selon l'âge. Lignes terminées par |* : note estimée.
// Format d'une ligne : POSTE[/POSTE2]|prénom|nom|âge|note|potentiel[|*  ou |club d'origine]
// Prix : calculés plus bas (valueOf) selon la note, le poste, l'âge et la marge de progression.
var LEAGUES = [
  { id: 'PL', name: 'Premier League' },
  { id: 'LL', name: 'LaLiga' },
  { id: 'SA', name: 'Serie A' },
  { id: 'BL', name: 'Bundesliga' },
  { id: 'L1', name: 'Ligue 1' },
  { id: 'XX', name: 'Autres' }
];
var CLUBS = [];
var CLUB = {};
var PLAYERS = {};
var MANAGERS = {};
var POOL_IDS = [];
var FREE_MGR_IDS = [];

function splitPos(s) { var a = String(s).split('/'); return { pos: a[0], pos2: a[1] || '' }; }
function parseLine(line) {
  var p = line.split('|'), ps = splitPos(p[0]);
  return { pos: ps.pos, pos2: ps.pos2, fn: p[1], ln: p[2], age: +p[3], ovr: +p[4], pot: +p[5], val: 0, from: p[6] && p[6] !== '*' ? p[6] : '', est: p[6] === '*' };
}
// Prix d'un entraîneur selon sa note tactique et son potentiel
function mgrPrice(tac, pot) { return Math.round(4 * Math.pow(1.15, tac - 70) + 0.8 * Math.max(0, pot - tac)); }

function C(id, name, short, lg, colors, tier, mgr, squad, legends, pack) {
  var club = { id: id, name: name, short: short, lg: lg, colors: colors, tier: tier, squad: [], legends: [], pack: [] };
  var mid = 'm-' + id;
  MANAGERS[mid] = { id: mid, fn: mgr[0], ln: mgr[1], tac: mgr[2], pot: mgr[3], val: mgrPrice(mgr[2], mgr[3]), club: id };
  club.mgr = mid;
  squad.trim().split('\n').forEach(function (line, i) {
    var d = parseLine(line.trim());
    var pid = id + '-' + (i + 1);
    d.id = pid; d.club = id; d.kind = 'club';
    PLAYERS[pid] = d; club.squad.push(pid);
  });
  var tiers = ['r', 'o', 'u'];
  legends.forEach(function (l, i) {
    var pid = id + '-L' + (i + 1), ps = splitPos(l[0]);
    PLAYERS[pid] = { id: pid, pos: ps.pos, pos2: ps.pos2, fn: l[1], ln: l[2], age: 0, ovr: l[3], pot: l[3], val: 0, club: id, kind: 'legend', tier: tiers[i] };
    club.legends.push(pid);
  });
  // Pack club : 3 joueurs par rareté (Commun, Rare, Épique, Mythique)
  var rar = ['C', 'R', 'E', 'M'];
  pack.forEach(function (l, i) {
    var pid = id + '-P' + (i + 1), ps = splitPos(l[0]);
    PLAYERS[pid] = { id: pid, pos: ps.pos, pos2: ps.pos2, fn: l[1], ln: l[2], age: 0, ovr: l[3], pot: l[3], val: 0, club: id, kind: 'pack', rarity: rar[Math.floor(i / 3)] };
    club.pack.push(pid);
  });
  CLUBS.push(club); CLUB[id] = club;
}

C("ars", "Arsenal", "ARS", "PL", ["#DB0007","#FFFFFF"], 5, ["Mikel","Arteta",87,89], `
G|David|Raya|31|88|88
G|Kepa|Arrizabalaga|31|78|78
G|Illan|Meslier|26|71|71
DC||Gabriel|28|89|89
MDC/MC|Declan|Rice|27|88|88
DC|William|Saliba|25|88|89
AD/MD|Bukayo|Saka|25|87|88
BU|Viktor|Gyökeres|28|86|86
MC/MDC|Bruno|Guimarães|28|86|86
MC/MOC|Martin|Ødegaard|27|86|86
DD|Jurriën|Timber|25|84|85
MDC/MC|Martín|Zubimendi|27|84|84
MOC/MC|Eberechi|Eze|28|84|84
DC|Ezri|Konsa|28|84|84
DG|Piero|Hincapié|24|84|86
MC/MOC|Mikel|Merino|30|83|83
AG/MG|Christos|Tzolis|24|82|84
DG|Riccardo|Calafiori|24|82|84
BU|Kai|Havertz|27|81|81
DD|Ben|White|28|81|81
AD/MD|Noni|Madueke|24|80|82
DG|Myles Anthony|Lewis-Skelly|20|78|86
DC|Cristhian|Mosquera|22|78|83
AD/MD|Max|Dowman|16|70|82|*`,
  [["MOC/MC","Mesut","Özil",86],["MC/MDC","Patrick","Vieira",89],["BU","Thierry","Henry",94]],
  [["MC/MOC","Ray","Parlour",78],["DD","Lee","Dixon",77],["DG","Nigel","Winterburn",77],["MG/AG","Freddie","Ljungberg",81],["MDC/MC","Emmanuel","Petit",81],["DC","Sol","Campbell",82],["MG/AG","Robert","Pirès",85],["MC/MOC","Cesc","Fàbregas",85],["DC","Tony","Adams",84],["BU","Ian","Wright",87],["BU","Robin","van Persie",88],["G","Jens","Lehmann",86]]);

C("mci", "Manchester City", "MCI", "PL", ["#6CABDD","#1C2C5B"], 5, ["Enzo","Maresca",84,87], `
G|Gianluigi|Donnarumma|27|89|89
G|Gerónimo|Rulli|33|80|80
G|Marcus|Bettinelli|33|69|69
BU|Erling|Haaland|26|91|91
DC|Rúben|Dias|29|87|87
AD/MD|Rayan|Cherki|23|86|89
MC/MOC|Enzo|Fernández|25|86|87
DC|Josko|Gvardiol|24|85|87
AD/MD|Antoine|Semenyo|26|85|85
DC|Marc|Guéhi|26|85|85
AD/MD|Phil|Foden|25|84|85
AG/MG|Jérémy|Doku|24|84|86
MDC/MC|Elliot|Anderson|23|84|87
DG|Nico|O'Reilly|21|83|89
MC/MOC|Matheus|Nunes|27|83|83
DC|Abdukodir|Khusanov|21|82|88
DG|Rayan|Aït-Nouri|25|81|82
MC/MDC|Mateo|Kovacic|32|81|81
AG/MG|Iliman|Ndiaye|26|80|80|*
DD|Rico|Lewis|21|77|83
DC|Vitor|Reis|20|76|84
MC/MDC|Ayyoub|Bouaddi|18|75|87|*
DC|Juma|Bah|19|73|83
MC/MDC||Allan|22|70|75|*
DG|Josh|Wilson-Esbrand|23|66|69`,
  [["MOC/MC","David","Silva",87],["MC/MOC","Colin","Bell",86],["BU","Sergio","Agüero",93]],
  [["AD/MD","Shaun","Wright-Phillips",77],["G","Joe","Hart",78],["MOC/MC","Samir","Nasri",78],["DD","Pablo","Zabaleta",81],["MDC/MC","","Fernandinho",82],["BU","Edin","Džeko",82],["DC","Vincent","Kompany",85],["DG","Aleksandar","Kolarov",83],["BU","Mario","Balotelli",83],["MC/MOC","Yaya","Touré",87],["BU","Carlos","Tevez",86],["MOC/MC","Georgi","Kinkladze",85]]);

C("liv", "Liverpool", "LIV", "PL", ["#C8102E","#F6EB61"], 5, ["Andoni","Iraola",82,85], `
G||Alisson|33|87|87
G|Vitezslav|Jaros|25|72|73
G|Freddie|Woodman|28|71|71
DC|Virgil|van Dijk|35|88|88
MOC/MC|Florian|Wirtz|23|86|89
MOC/MC|Dominik|Szoboszlai|25|86|87
BU|Alexander|Isak|27|86|86
BU|Hugo|Ekitiké|24|85|87
MDC/MC|Ryan|Gravenberch|24|85|87
AG/MG|Bradley|Barcola|24|85|87
MC/MDC|Alexis|Mac Allister|27|84|84
AG/MG|Cody|Gakpo|27|82|82
DG|Milos|Kerkez|22|81|86
DD|Jeremie|Frimpong|25|81|82
MC/MOC|Curtis|Jones|25|80|81|*
DC|Ronald|Araujo|27|80|80
AD/MD|Federico|Chiesa|28|80|80
DD|Conor|Bradley|23|79|82
AG/MG|Víctor|Muñoz|23|79|82
DC|Joe|Gomez|29|79|79
MDC/MC|Wataru|Endo|33|78|78
MOC/MC|Harvey|Elliott|23|77|80
DC|Jérémy|Jacquet|21|77|83
DG|Konstantinos|Tsimikas|30|76|76
AG/MG|Rio|Ngumoha|17|75|87`,
  [["MC/MDC","Xabi","Alonso",87],["BU","Ian","Rush",88],["MC/MOC","Steven","Gerrard",93]],
  [["AD/MD","Dirk","Kuyt",78],["MDC/MC","Lucas","Leiva",77],["DG","John Arne","Riise",77],["DC","Jamie","Carragher",82],["DC","Daniel","Agger",81],["MOC/MC","Luis","García",80],["DC","Sami","Hyypiä",84],["AG/MG","John","Barnes",85],["BU","Michael","Owen",85],["BU","Robbie","Fowler",86],["BU","Kenny","Dalglish",88],["MC/MDC","Graeme","Souness",87]]);

C("che", "Chelsea", "CHE", "PL", ["#034694","#FFFFFF"], 5, ["Xabi","Alonso",87,90], `
G|Robert|Sánchez|28|80|80
G|Mike|Penders|21|78|84
G|Gabriel|Slonina|22|68|73
MDC/MC|Moisés|Caicedo|24|86|88
MOC/MC|Cole|Palmer|24|85|87
MOC/MC|Morgan|Rogers|24|84|86
DD|Reece|James|26|84|84
BU|João|Pedro|24|83|85
DC|Maxence|Lacroix|26|82|82
MD/AD|Pedro|Neto|26|81|81
MD/AD||Estêvão|19|80|90
DC|Levi|Colwill|23|80|83
BU|Danny|Welbeck|35|80|80
MC/MOC|Valentín|Barco|22|79|84
DC|Wesley|Fofana|25|79|80
DG|Pep|Chavarría|28|79|79
DG|Jorrel|Hato|20|78|86
MDC/MC|Roméo|Lavia|22|78|83
DD|Marco|Palestra|21|78|84
BU|Emmanuel|Emegha|23|78|81
MDC/MC|Jordan|Henderson|36|78|78
MG/AG|Jamie|Gittens|22|77|82
DC|Tosin|Adarabioyo|29|77|77
MD/AD|Geovany|Quenda|19|76|86
DC|Josh|Acheampong|20|75|83`,
  [["AG/MG","Eden","Hazard",88],["MOC/MC","Gianfranco","Zola",87],["MC/MOC","Frank","Lampard",92]],
  [["MDC/MC","John Obi","Mikel",78],["MC/MDC","","Ramires",77],["DD","Branislav","Ivanović",78],["DG","Ashley","Cole",82],["DC","Ricardo","Carvalho",81],["MOC/MC","Juan","Mata",81],["G","Petr","Čech",85],["MC/MDC","Michael","Essien",84],["DC","Marcel","Desailly",84],["BU","Didier","Drogba",88],["DC","John","Terry",87],["AG/MG","Damien","Duff",86]]);

C("mun", "Manchester United", "MUN", "PL", ["#DA291C","#FBE122"], 4, ["Michael","Carrick",75,80], `
G|Senne|Lammens|24|82|84
G|Karl|Darlow|35|76|76
G|Tom|Heaton|39|67|67
MOC/MC|Bruno|Fernandes|31|89|89
MC/MOC|Youri|Tielemans|28|85|85
AD/MD|Bryan|Mbeumo|26|84|84
BU|Matheus|Cunha|26|84|84
AG/MG|Marcus|Rashford|28|82|82
BU|Benjamin|Sesko|23|82|85
DC|Matthijs|de Ligt|27|82|82
DC|Lisandro|Martínez|28|82|82
DC|Harry|Maguire|32|82|82
MC/MDC|Kobbie|Mainoo|21|81|87
MC/MDC|Andrey|Santos|22|80|85
DD|Noussair|Mazraoui|28|80|80
AD/MD|Amad|Diallo|24|79|81|*
DG|Luke|Shaw|30|79|79
DC|Leny|Yoro|20|78|86
DD|Diogo|Dalot|27|78|78
MG/AG|Patrick|Dorgu|21|78|84
MOC/MC|Mason|Mount|27|78|78
MDC/MC|Manuel|Ugarte|25|77|78
BU|Joshua|Zirkzee|24|77|79
DC|Ayden|Heaven|19|75|85
MDC/MC|Toby|Collyer|22|70|75`,
  [["BU","Wayne","Rooney",89],["BU","Eric","Cantona",90],["AD/MD","George","Best",93]],
  [["MC/MDC","Darren","Fletcher",77],["MD/AD","Ji-sung","Park",78],["DD","John","O'Shea",77],["DC","Nemanja","Vidić",82],["DC","Rio","Ferdinand",82],["BU","Dimitar","Berbatov",81],["MC/MOC","Paul","Scholes",85],["MDC/MC","Roy","Keane",85],["BU","Ole Gunnar","Solskjær",83],["AG/MG","Ryan","Giggs",88],["G","Peter","Schmeichel",87],["MD/AD","David","Beckham",87]]);

C("tot", "Tottenham", "TOT", "PL", ["#132257","#FFFFFF"], 4, ["Roberto","De Zerbi",84,86], `
G|Guglielmo|Vicario|29|80|80|*
G|Antonín|Kinský|23|77|80
G|Martin|Dúbravka|37|77|77
MDC/MC|Sandro|Tonali|26|85|85
DD|Pedro|Porro|27|83|83
AG/MG|Omar|Marmoush|27|82|82
MC/MOC|James|Maddison|29|82|82
DC|Marcos|Senesi|29|82|82
MOC/MC|Xavi|Simons|23|81|84
DC|Micky|van de Ven|25|81|82
MD/AD|Mohammed|Kudus|26|81|81
DC|Jan Paul|van Hecke|26|81|81
MC/MOC|Dejan|Kulusevski|26|81|81
AD/MD||Savinho|22|80|85
MC/MOC|Mateus|Fernandes|22|80|85
DG|Andrew|Robertson|32|80|80
MC/MDC|Pape Matar|Sarr|24|79|81
BU|Dominic|Solanke|29|79|79
MDC/MC|Rodrigo|Bentancur|29|79|79
DG|Destiny|Udogie|23|79|82
MC/MOC|Conor|Gallagher|26|78|78
MC/MOC|Lucas|Bergvall|20|78|86
AG/MG|Mathys|Tel|21|78|84
AG/MG|Wilson|Odobert|21|78|84
BU||Richarlison|29|78|78`,
  [["AD/MD","Gareth","Bale",88],["MOC/MC","Glenn","Hoddle",87],["BU","Jimmy","Greaves",92]],
  [["AD/MD","Aaron","Lennon",77],["DC","Michael","Dawson",77],["MC/MDC","Tom","Huddlestone",76],["DC","Ledley","King",82],["BU","Robbie","Keane",81],["MC/MDC","Mousa","Dembélé",81],["BU","Teddy","Sheringham",84],["MOC/MC","Rafael","van der Vaart",84],["MC/MOC","Osvaldo","Ardiles",84],["BU","Jürgen","Klinsmann",87],["MOC/MC","Paul","Gascoigne",87],["BU","Gary","Lineker",87]]);

C("rma", "Real Madrid", "RMA", "LL", ["#FFFFFF","#FEBE10"], 5, ["José","Mourinho",85,85], `
G|Thibaut|Courtois|34|90|90
G|Andriy|Lunin|27|80|80
BU|Kylian|Mbappé|27|91|91
MOC/MC|Jude|Bellingham|23|90|93
AG/MG|Vinicius|Junior|26|89|89
MC/MOC|Federico|Valverde|28|87|87
DG|Marc|Cucurella|28|86|86
AG/MG||Rodrygo|25|84|85
MDC/MC|Aurélien|Tchouaméni|26|84|84
AD/MD|Yan|Diomande|19|84|94
DC|Ibrahima|Konaté|27|84|84
DD|Trent|Alexander-Arnold|27|84|84
MC/MOC|Bernardo|Silva|32|84|84
DC|Éder|Militão|28|84|84
MD/AD|Arda|Güler|21|83|89
DD|Denzel|Dumfries|30|83|83
DC|Antonio|Rüdiger|33|83|83
DC|Dean|Huijsen|20|81|89
MC/MDC|Eduardo|Camavinga|23|81|84
MD/AD|Brahim|Díaz|27|81|81
DG|Álvaro Fernández|Carreras|23|81|84
DG|Ferland|Mendy|30|80|80
DC|Raúl|Asencio|23|78|81
BU|Carlos|Espí|21|77|83
MC/MOC|Thiago|Pitarch|19|70|80`,
  [["DG","","Marcelo",87],["MOC/MC","Zinédine","Zidane",92],["AG/MG","Cristiano","Ronaldo",95]],
  [["MC/MOC","Esteban","Granero",77],["DD","Míchel","Salgado",78],["MG/AG","Steve","McManaman",78],["DC","Fernando","Hierro",82],["MOC/MC","","Guti",82],["MDC/MC","Fernando","Redondo",82],["G","Iker","Casillas",85],["DG","Roberto","Carlos",85],["BU","Emilio","Butragueño",84],["BU","","Raúl",88],["BU","Hugo","Sánchez",87],["BU","Ferenc","Puskás",89]]);

C("bar", "FC Barcelone", "BAR", "LL", ["#A50044","#004D98"], 5, ["Hansi","Flick",88,88], `
G|Joan|García|25|86|87
G|Wojciech|Szczesny|35|81|81
G|Dominik|Livakovic|31|78|78|*
AD/MD|Lamine|Yamal|19|90|95
MC/MOC||Pedri|23|90|93
MDC/MC||Rodri|30|90|90
AG/MG||Raphinha|29|88|88
DC|Pau|Cubarsí|19|86|95
MC/MDC|Frenkie|de Jong|29|86|86
MOC/MC|Fermín|López|23|85|88
DD|Jules|Koundé|27|85|85
DC|Eric|García|25|85|86
MOC/MC|Dani|Olmo|28|84|84
MC/MOC||Gavi|22|83|88
DG|João|Cancelo|32|83|83
AG/MG|Anthony|Gordon|25|82|83
MD/AD|Karim|Adeyemi|24|82|84
DG|Alejandro|Balde|22|82|87
DC|Gerard|Martín|24|79|81
BU|Gabriel|Jesus|29|79|79
DC|Andreas|Christensen|30|79|79
MDC/MC|Marc|Bernal|18|78|90
AD/MD|Roony|Bardghji|20|74|82
DD|Héctor|Fort|19|72|82
MC/MOC|Tommy|Marqués|19|68|78|*`,
  [["MC/MOC","Andrés","Iniesta",90],["AG/MG","","Ronaldinho",91],["AD/MD","Lionel","Messi",96]],
  [["MC/MDC","Seydou","Keita",78],["DG","","Sylvinho",77],["BU","Bojan","Krkić",76],["DG","Eric","Abidal",81],["DC","Rafael","Márquez",81],["DC","Gerard","Piqué",82],["DC","Carles","Puyol",85],["AG/MG","","Rivaldo",85],["AG/MG","Hristo","Stoichkov",85],["BU","Samuel","Eto'o",88],["MOC/MC","Michael","Laudrup",87],["BU","Patrick","Kluivert",86]]);

C("atm", "Atlético de Madrid", "ATM", "LL", ["#CB3524","#272E61"], 4, ["Diego","Simeone",87,87], `
G|Jan|Oblak|33|88|88
G|Juan|Musso|32|82|82
G|Salvi|Esquivel|20|64|72
BU|Julián|Alvarez|26|86|86
MG/AG|Alejandro|Grimaldo|31|85|85
DD|Marcos|Llorente|31|85|85
MC/MDC|Pablo|Barrios|22|83|88
BU|Ademola|Lookman|28|83|83
MG/AG|Álex|Baena|25|83|84
BU|Alexander|Sørloth|30|83|83
MDC/MC|Morten|Hjulmand|27|83|83
DC|Dávid|Hancko|28|83|83
MD/AD|Giuliano|Simeone|23|82|85
DC|Cristian|Romero|28|82|82
DC|José María|Giménez|31|82|82
DC|Robin|Le Normand|29|81|81
DC|Marc|Pubill|23|81|84
MC/MDC||Koke|34|81|81
AD/MD|Kang-in|Lee|25|80|81
BU|Jonathan|David|26|80|80
MOC/MC|Thiago|Almada|25|80|81|*
MDC/MC|Johnny|Cardoso|25|80|81
AG/MG|Nico|González|28|79|79|*
MDC/MC|Obed|Vargas|20|72|80
MC/MDC|Rodrigo|Mendoza|21|71|77`,
  [["DC","Diego","Godín",87],["MOC/MC","Luis","Aragonés",86],["BU","Fernando","Torres",90]],
  [["MC/MDC","Tiago","Mendes",78],["DD","","Juanfran",77],["MC/MDC","Mario","Suárez",76],["MC/MDC","","Gabi",81],["MOC/MC","Raúl","García",80],["DC","","Miranda",81],["MOC/MC","Arda","Turan",83],["BU","Diego","Forlán",84],["BU","","Kiko",83],["BU","Diego","Costa",86],["MC/MOC","","Adelardo",86],["MOC/MC","Juan Carlos","Valerón",86]]);

C("int", "Inter", "INT", "SA", ["#0068A8","#000000"], 4, ["Cristian","Chivu",81,85], `
G|Ivan|Provedel|32|83|83
G|Josep|Martínez|28|76|76
G|Raffaele|Di Gennaro|32|68|68
BU|Lautaro|Martínez|29|87|87
MC/MOC|Nicolò|Barella|29|87|87
DG|Federico|Dimarco|28|86|86
DC|Alessandro|Bastoni|27|86|86
BU|Marcus|Thuram|29|85|85
MDC/MC|Hakan|Çalhanoğlu|32|85|85
DC|Manuel|Akanji|31|83|83
MC/MOC|Piotr|Zielinski|32|82|82
DC|John|Stones|31|82|82
MC/MOC|Henrikh|Mkhitaryan|37|81|81
DG|Carlos|Augusto|27|80|80
MC/MOC|Davide|Frattesi|27|80|80|*
DG|Djed|Spence|26|80|80
DC|Yann|Bisseck|25|78|79
MC/MOC|Petar|Sučić|22|78|83
BU|Ange-Yoan|Bonny|22|78|83
BU|Pio|Esposito|21|77|83
DD|Luis|Henrique|24|77|79
MC/MDC|Andy|Diouf|23|76|79
MDC/MC|Aleksandar|Stanković|21|76|82`,
  [["MOC/MC","Wesley","Sneijder",87],["BU","Giuseppe","Meazza",88],["BU","Ronaldo","Nazário",95]],
  [["DC","Iván","Córdoba",78],["MC/MOC","Dejan","Stanković",78],["DD","","Maicon",78],["MDC/MC","Esteban","Cambiasso",82],["DC","Walter","Samuel",82],["G","Júlio","César",82],["BU","Diego","Milito",85],["DG","Giacinto","Facchetti",85],["BU","","Adriano",84],["BU","Christian","Vieri",88],["DD","Javier","Zanetti",89],["BU","Karl-Heinz","Rummenigge",87]]);

C("mil", "AC Milan", "MIL", "SA", ["#FB090B","#000000"], 4, ["Rúben","Amorim",80,84], `
G|Mike|Maignan|31|87|87
G|Pietro|Terracciano|35|76|76
G|Lorenzo|Torriani|20|62|70
MC/MOC|Adrien|Rabiot|30|85|85
MC/MOC|Luka|Modrić|40|85|85
MOC/MC|Christian|Pulisic|27|83|83
DC|Mario|Gila|25|81|82
BU|Gonçalo|Ramos|25|80|81
DD|Alexis|Saelemaekers|26|80|80
DC|Matteo|Gabbia|26|80|80
DC|Fikayo|Tomori|27|80|80
MD/AD|Diego|Moreira|22|79|84
MOC/MC|Ruben|Loftus-Cheek|30|79|79
DC|Strahinja|Pavlović|25|78|79
DG|Pervis|Estupiñán|28|78|78
AD/MD|Omari|Hutchinson|22|77|82|*
MDC/MC|Ardon|Jashari|23|76|79
DC|Koni|De Winter|24|75|77
DG|Davide|Bartesaghi|20|74|82
DC|Filippo|Terracciano|23|71|74
MDC/MC|Warren|Bondo|22|70|75
MOC/MC|Alphadjo|Cissè|19|66|76
MC/MDC|Christian|Comotto|18|65|77`,
  [["MOC/MC","","Kaká",89],["BU","Marco","van Basten",92],["DG","Paolo","Maldini",95]],
  [["MC/MDC","Massimo","Ambrosini",78],["DD","Ignazio","Abate",77],["DD","Massimo","Oddo",77],["MDC/MC","Gennaro","Gattuso",82],["BU","Filippo","Inzaghi",82],["G","","Dida",81],["MC/MDC","Andrea","Pirlo",85],["DC","Alessandro","Nesta",85],["MC/MOC","Clarence","Seedorf",85],["BU","Andriy","Shevchenko",88],["MC/MOC","Ruud","Gullit",88],["DC","Franco","Baresi",89]]);

C("juv", "Juventus", "JUV", "SA", ["#000000","#FFFFFF"], 4, ["Luciano","Spalletti",84,84], `
G|Michele|Di Gregorio|29|80|80
G|Kamil|Grabara|27|77|77|*
G|Carlo|Pinsoglio|36|68|68
DC||Bremer|29|86|86
MOC/MC|Kenan|Yıldız|21|84|90
MDC/MC|Manuel|Locatelli|28|84|84
MC/MDC|Khéphren|Thuram|25|81|82
DC|Pierre|Kalulu|26|81|81
MD/AD||Neto|37|81|81
BU|Nick|Woltemade|24|80|82|*
AD/MD|Francisco|Conceição|23|80|83
DG|Andrea|Cambiaso|26|80|80
MC/MOC|Weston|McKennie|28|80|80
DC|Federico|Gatti|28|79|79
DD|Zeki|Çelik|29|79|79
MOC/MC|Teun|Koopmeiners|28|78|78
AD/MD|Edon|Zhegrova|27|78|78
MDC/MC|Douglas|Luiz|28|78|78
MOC/MC|Jérémie|Boga|29|78|78
BU|Randal Kolo|Muani|26|77|77
DC|Lloyd|Kelly|27|77|77
DC|Jhon|Lucumí|28|76|76
BU|Arkadiusz|Milik|32|76|76
DG|Juan|Cabal|25|74|75
DC|Daniele|Rugani|32|74|74`,
  [["G","Gianluigi","Buffon",89],["MOC/MC","Michel","Platini",92],["BU","Alessandro","Del Piero",93]],
  [["MC/MDC","Claudio","Marchisio",78],["MD/AD","Mauro","Camoranesi",78],["DD","Gianluca","Zambrotta",78],["DC","Giorgio","Chiellini",82],["DC","Leonardo","Bonucci",82],["MC/MDC","Edgar","Davids",82],["MOC/MC","Pavel","Nedvěd",85],["DC","Fabio","Cannavaro",85],["BU","Gianluca","Vialli",84],["MOC/MC","Roberto","Baggio",88],["BU","Paolo","Rossi",87],["DC","Gaetano","Scirea",87]]);

C("nap", "Naples", "NAP", "SA", ["#12A0D7","#FFFFFF"], 4, ["Massimiliano","Allegri",85,85], `
G|Alex|Meret|29|81|81
G|Vanja|Milinković-Savić|29|80|80
G|Nikita|Contini|29|67|67
MC/MOC|Scott|McTominay|29|86|86
MOC/MC|Kevin|De Bruyne|35|85|85
MC/MDC|Stanislav|Lobotka|31|83|83
DC|Amir|Rrahmani|32|83|83
MC/MDC|Frank|Anguissa|30|82|82|*
DD|Giovanni|Di Lorenzo|32|82|82
DC|Alessandro|Buongiorno|27|81|81
AG/MG|David|Neres|29|81|81
AD/MD|Matteo|Politano|32|80|80
DG|Leonardo|Spinazzola|32|80|80
BU|Rasmus|Højlund|23|78|81
DC|Sam|Beukema|27|78|78
DG|Mathías|Olivera|28|77|77
DC|Rafa|Marín|24|76|78
DC|Benoît|Badiashile|25|76|77
MC/MDC|Billy|Gilmour|25|75|76
MOC/MC|Alisson|Santos|23|74|77
MDC/MC|Jens|Cajuste|26|73|73
MD/AD|Cyril|Ngonge|26|72|72
BU|Walid|Cheddira|28|72|72
BU||Giovane|22|71|76
DD|Pasquale|Mazzocchi|31|71|71`,
  [["MC/MOC","Marek","Hamšík",86],["BU","","Careca",87],["MOC/MC","Diego","Maradona",97]],
  [["DD","Christian","Maggio",77],["DC","Paolo","Cannavaro",76],["MC/MDC","Walter","Gargano",76],["AD/MD","Ezequiel","Lavezzi",81],["AD/MD","José","Callejón",80],["MDC/MC","Gökhan","Inler",80],["DC","Ciro","Ferrara",84],["BU","Bruno","Giordano",83],["MC/MDC","Fernando","De Napoli",83],["BU","Dries","Mertens",86],["AG/MG","Lorenzo","Insigne",85],["MC/MDC","Salvatore","Bagni",85]]);

C("bay", "Bayern Munich", "BAY", "BL", ["#DC052D","#0066B2"], 5, ["Vincent","Kompany",86,89], `
G|Manuel|Neuer|40|81|81
G|Jonas|Urbig|23|79|82
G|Sven|Ulreich|38|73|73
MD/AD|Michael|Olise|24|90|92
BU|Harry|Kane|33|90|90
AG/MG|Luis|Díaz|29|88|88
MDC/MC|Joshua|Kimmich|31|88|88
AG/MG|Jamal|Musiala|23|87|90
DC|Dayot|Upamecano|27|87|87
DC|Jonathan|Tah|30|87|87
DD|Konrad|Laimer|29|85|85
MDC/MC|Aleksandar|Pavlovic|22|83|88
MOC/MC|Ismael|Saibari|25|83|84
AG/MG|Serge|Gnabry|31|83|83
DC|Min-jae|Kim|29|83|83
DG|Alphonso|Davies|25|82|83
DG|Nathaniel|Brown|23|81|84
DD|Josip|Stanisic|26|80|80
MC/MOC|Tom|Bischof|21|79|85
DC|Hiroki|Ito|27|78|78
MD/AD|Lennart|Karl|18|77|89
MG/AG|Bryan|Zaragoza|25|77|78
DD|Sacha|Boey|26|75|75
AG/MG|Wisdom|Mike|17|66|78|*
DC|Tarek|Buchmann|21|66|72|*`,
  [["AD/MD","Arjen","Robben",89],["BU","Gerd","Müller",92],["DC","Franz","Beckenbauer",95]],
  [["DC","Holger","Badstuber",77],["DC","Daniel","Van Buyten",78],["MD/AD","Hasan","Salihamidžić",77],["BU","Mario","Gómez",82],["MOC/MC","Mehmet","Scholl",81],["BU","Giovane","Élber",82],["DD","Philipp","Lahm",85],["MC/MDC","Bastian","Schweinsteiger",85],["DG","Bixente","Lizarazu",84],["AG/MG","Franck","Ribéry",88],["G","Oliver","Kahn",88],["MC/MDC","Lothar","Matthäus",89]]);

C("bvb", "Borussia Dortmund", "BVB", "BL", ["#FDE100","#000000"], 4, ["Niko","Kovač",80,81], `
G|Gregor|Kobel|28|87|87
G|Alexander|Meyer|34|74|74
G|Patrick|Drewes|33|71|71
DC|Nico|Schlotterbeck|26|87|87
BU|Serhou|Guirassy|30|85|85
MC/MOC|Felix|Nmecha|25|85|86
DC|Waldemar|Anton|30|84|84
DD|Julian|Ryerson|28|82|82
MC/MOC|Joey|Veerman|27|82|82
MOC/MC|Maximilian|Beier|23|81|84
MC/MOC|Marcel|Sabitzer|32|81|81
DC|Emre|Can|32|81|81
DG|Daniel|Svensson|24|79|81
DC|Ramy|Bensebaini|31|79|79
MOC/MC|Giannis|Konstantelias|23|79|82
BU|Fábio|Silva|24|78|80
MOC/MC|Carney|Chukwuemeka|22|78|83
MC/MOC|Jobe|Bellingham|21|77|83
MOC/MC|Konstantinos|Karetsas|18|76|88
MOC/MC|Samuele|Inácio|18|70|82
DC|Joane|Gadou|19|68|78
DC|Luca|Reggiani|18|67|79
DG|Kauã|Prates|18|67|79
MOC/MC|Justin|Lerma|18|66|78
MG/AG|Mathis|Albert|17|66|78`,
  [["DC","Mats","Hummels",87],["DC","Matthias","Sammer",88],["MOC/MC","Marco","Reus",90]],
  [["MD/AD","Kevin","Großkreutz",77],["MDC/MC","Sebastian","Kehl",77],["AD/MD","Jakub","Błaszczykowski",78],["DD","Łukasz","Piszczek",82],["DC","Neven","Subotić",80],["MC/MDC","Nuri","Şahin",81],["DC","Jürgen","Kohler",84],["MOC/MC","Lars","Ricken",83],["DD","Stefan","Reuter",83],["MOC/MC","Andreas","Möller",86],["BU","Karl-Heinz","Riedle",86],["MOC/MC","Tomáš","Rosický",86]]);

C("b04", "Bayer Leverkusen", "B04", "BL", ["#E32221","#000000"], 4, ["Carles","Martínez",74,80], `
G|Mark|Flekken|33|77|77
G|Janis|Blaswich|35|74|74
G|Niklas|Lomb|33|66|66
MC/MDC|Aleix|García|29|84|84
BU|Patrik|Schick|30|83|83
DC|Edmond|Tapsoba|27|82|82
MOC/MC|Ibrahim|Maza|20|80|88
DG|Miguel|Gutiérrez|25|80|81
MOC/MC|Malik|Tillman|24|79|81
DC|Facundo|Medina|27|79|79
AD/MD|Moussa|Diaby|27|79|79|*
MG/AG|Afonso|Moreira|21|78|84
MD/AD|Nathan|Tella|27|78|78
MDC/MC|Robert|Andrich|32|78|78
DC|Jarell|Quansah|23|77|80
DC|Loïc|Badé|26|77|77
BU|Christian|Kofane|20|77|85
MOC/MC|Martin|Terrier|29|77|77
MD/AD|Ernest|Poku|22|76|81
MOC/MC|Jonas|Hofmann|34|76|76
MDC/MC|Equi|Fernández|24|75|77|*
MOC/MC|Eliesse|Ben Seghir|21|74|80
DD|Lucas|Vázquez|35|74|74
MD/AD||Arthur|23|73|76
DC|Tim|Oermann|22|72|77`,
  [["BU","Stefan","Kießling",84],["BU","Ulf","Kirsten",86],["MC/MOC","Michael","Ballack",90]],
  [["MC/MDC","Simon","Rolfes",78],["MD/AD","Gonzalo","Castro",77],["MDC/MC","Lars","Bender",77],["MD/AD","Bernd","Schneider",82],["MDC/MC","Carsten","Ramelow",80],["DC","Jens","Nowotny",81],["DC","","Lúcio",84],["MG/AG","Zé","Roberto",84],["MOC/MC","Yıldıray","Baştürk",83],["BU","Rudi","Völler",86],["MC/MOC","Toni","Kroos",88],["AG/MG","Paulo","Sérgio",85]]);

C("psg", "Paris Saint-Germain", "PSG", "L1", ["#004170","#DA291C"], 5, ["Luis","Enrique",93,93], `
G|Matvey|Safonov|27|83|83
G|Lucas|Chevalier|24|80|82
G|Renato|Marin|20|64|72|*
BU|Ousmane|Dembélé|29|90|90
MC/MDC||Vitinha|26|90|90
AG/MG|Khvicha|Kvaratskhelia|25|89|90
DG|Nuno|Mendes|24|89|91
DC|Willian|Pacho|24|89|91
MC/MDC|João|Neves|21|88|94
DD|Achraf|Hakimi|27|88|88
DC||Marquinhos|32|87|87
AD/MD|Désiré|Doué|21|86|92
MC/MOC|Fabián|Ruiz|30|86|86
BU|Ferran|Torres|26|84|84
MC/MDC|Warren|Zaïre-Emery|20|83|91
MOC/MC|Maghnes|Akliouche|24|81|83
DC|Lucas|Hernández|30|81|81
DC|Ilya|Zabarnyi|24|80|82
DG|Lucas|Digne|33|80|80
MC/MOC|Senny|Mayulu|19|79|89
DC|Lucas|Beraldo|22|79|84
MC/MOC|Dro|Fernández|18|73|85
AG/MG|Quentin|Ndjantou|18|70|82`,
  [["BU","Edinson","Cavani",88],["MOC/MC","","Raí",87],["BU","Zlatan","Ibrahimović",92]],
  [["MG/AG","Jérôme","Rothen",78],["DC","Mamadou","Sakho",77],["DG","Sylvain","Armand",77],["MDC/MC","Claude","Makélélé",81],["MOC/MC","Javier","Pastore",82],["DC","Mauricio","Pochettino",80],["BU","","Pauleta",85],["AG/MG","David","Ginola",84],["MOC/MC","Safet","Sušić",84],["BU","George","Weah",88],["MOC/MC","Mustapha","Dahleb",86],["MDC/MC","Luis","Fernández",86]]);

C("om", "Olympique de Marseille", "OM", "L1", ["#2FAEE0","#FFFFFF"], 3, ["Bruno","Genesio",78,79], `
G|Jeffrey|de Lange|28|74|74
G|Jelle|Van Neck|22|63|68
BU|Amine|Gouiri|25|80|81
MDC/MC|Pierre-Emile|Højbjerg|30|80|80
DC|Benjamin|Pavard|29|80|80
DC|Nayef|Aguerd|30|80|80
MG/AG|Igor|Paixão|25|79|80
DC|Leonardo|Balerdi|27|79|79
MD/AD|Timothy|Weah|25|78|79
MC/MOC|Matt|O'Riley|25|78|79|*
MC/MDC|Arthur|Vermeeren|21|77|83|*
MOC/MC|Hamed|Traoré|26|77|77|*
DG||Emerson|31|77|77
MDC/MC|Geoffrey|Kondogbia|33|76|76
MOC/MC|Angel|Gomes|25|75|76
MOC/MC|Himad|Abdelli|26|75|75
DC|CJ|Egan-Riley|23|75|78
MG/AG|Amine|Harit|28|74|74
DC|Derek|Cornelius|28|74|74
BU|Neal|Maupay|29|74|74
MDC/MC|Tochukwu|Nnadi|23|70|73
AG/MG|Ange|Lago|21|66|72|*`,
  [["MOC/MC","Dimitri","Payet",86],["AD/MD","Chris","Waddle",87],["BU","Jean-Pierre","Papin",92]],
  [["MOC/MC","Mathieu","Valbuena",78],["MC/MOC","Benoît","Cheyrou",76],["DC","Souleymane","Diawara",77],["G","Steve","Mandanda",82],["MDC/MC","Lassana","Diarra",80],["BU","Mamadou","Niang",81],["DC","Basile","Boli",84],["MC/MDC","Didier","Deschamps",84],["BU","Fabrizio","Ravanelli",84],["MOC/MC","Abedi","Pelé",87],["MC/MDC","Jean","Tigana",86],["BU","Josip","Skoblar",86]]);

C("asm", "AS Monaco", "ASM", "L1", ["#E7000B","#FFFFFF"], 3, ["Filipe","Luís",80,86], `
G|Lukas|Hradecky|36|79|79
G|Philipp|Köhn|28|77|77
G|Yann|Lienard|23|65|68
MDC/MC|Denis|Zakaria|29|81|81
MC/MDC|Lamine|Camara|22|80|85
BU|Folarin|Balogun|25|80|81
DD|Jordan|Teze|26|78|78
MOC/MC|Aleksandr|Golovin|30|78|78
MG/AG|Ansu|Fati|23|77|80
DD||Vanderson|25|77|78
MG/AG|Takumi|Minamino|30|77|77
DC|Eric|Dier|32|77|77
BU|Mika|Biereth|23|76|79
DC|Mohammed|Salisu|27|76|76
BU|Matthis|Abline|23|76|79
DC|Christian|Mawissa|21|75|81
MC/MDC|Mamadou|Coulibaly|22|73|78
MG/AG|Mathys|Detourbet|19|73|83
DG||Nazinho|23|72|75
DC|Sadibou|Sané|22|70|75
MG/AG|Stanis|Idumbo|21|68|74
MG/AG|Edan|Diop|21|68|74
BU|Paris|Brunner|20|66|74
MDC/MC|Pape|Cabral|19|63|73`,
  [["BU","Radamel","Falcao",86],["G","Jean-Luc","Ettori",85],["BU","Delio","Onnis",89]],
  [["MDC/MC","Jérémy","Toulalan",78],["DG","Patrice","Evra",78],["DC","Sébastien","Squillaci",76],["AD/MD","Ludovic","Giuly",82],["BU","Emmanuel","Adebayor",80],["BU","Shabani","Nonda",80],["BU","Fernando","Morientes",84],["DC","Lilian","Thuram",85],["BU","David","Trezeguet",85],["G","Fabien","Barthez",86],["MOC/MC","Youri","Djorkaeff",86],["MOC/MC","Enzo","Scifo",86]]);

C("ol", "Olympique Lyonnais", "OL", "L1", ["#FFFFFF","#14387F"], 3, ["Paulo","Fonseca",80,81], `
G|Dominik|Greif|29|81|81
G|Rémy|Descamps|30|75|75
G|Lassine|Diarra|23|64|67
MC/MOC|Corentin|Tolisso|32|82|82
DC|Moussa|Niakhaté|30|81|81
BU|Loïs|Openda|26|80|80
BU||Endrick|20|79|87
DD|Malo|Gusto|23|79|82
MOC/MC|Pavel|Sulc|25|79|80
MDC/MC|Tyler|Morton|23|79|82
DG|Nicolás|Tagliafico|34|78|78
MG/AG|Malick|Fofana|21|77|83
DD|Ainsley|Maitland-Niles|28|77|77
AG/MG|Keito|Nakamura|26|77|77|*
DC|Clinton|Mata|33|77|77
DG||Abner|26|76|76
MDC/MC|Tanner|Tessmann|25|75|76
DC|Ruben|Kluivert|25|75|76
MD/AD|Ernest|Nuamah|22|74|79
BU|Roman|Yaremchuk|30|74|74|*
MOC/MC|Khalis|Merah|19|73|83
MDC/MC|Mads|Bidstrup|25|73|74
MD/AD|Julien|Duranville|20|72|80
DC|Felix|Bacher|25|72|73
MC/MOC|Noah|Nartey|20|71|79`,
  [["BU","Alexandre","Lacazette",85],["BU","Sonny","Anderson",86],["MC/MOC","Juninho","Pernambucano",91]],
  [["MC/MOC","Kim","Källström",78],["DD","Anthony","Réveillère",77],["MDC/MC","Maxime","Gonalons",77],["AD/MD","Sidney","Govou",80],["MG/AG","Florent","Malouda",82],["DC","","Cris",81],["G","Grégory","Coupet",84],["MDC/MC","Mahamadou","Diarra",83],["MOC/MC","Hatem","Ben Arfa",83],["BU","","Fred",85],["BU","Bernard","Lacombe",86],["DC","","Edmílson",85]]);

C("slb", "Benfica", "SLB", "XX", ["#E83030","#FFFFFF"], 3, ["Marco","Silva",81,82], `
G|Anatoliy|Trubin|25|80|81
G|Samuel|Soares|24|70|72
BU|Vangelis|Pavlidis|27|82|82
MDC/MC|João|Palhinha|31|82|82
MC/MDC|Fredrik|Aursnes|30|81|81
AG/MG|Andreas|Schjelderup|22|80|85
AD/MD|Dodi|Lukébakio|29|80|80
MOC/MC|Rafa|Silva|33|80|80
DC|Tomás|Araújo|24|78|80
MC/MDC|Richard|Ríos|26|78|78
BU|Jhon|Durán|22|78|83
MOC/MC|Georgiy|Sudakov|24|78|80
DD|Alexander|Bah|28|78|78
MDC/MC|Enzo|Barrenechea|25|77|78
MC/MDC|Leandro|Barreiro|26|77|77
MG/AG|Jakub|Kamiński|24|77|79
DC|Clément|Lenglet|31|77|77
DG|Samuel|Dahl|23|75|78
AD/MD|Gianluca|Prestianni|20|75|83
AG/MG||Bruma|31|75|75
DG|David|Jurásek|26|75|75|*
DC|Alessandro|Circati|22|74|79
BU|Claudio|Echeverri|20|73|81
AD/MD|Tiago|Gouveia|25|73|74|*
MDC/MC|Manu|Silva|25|72|73`,
  [["AD/MD","Ángel","Di María",86],["MOC/MC","Rui","Costa",88],["BU","","Eusébio",95]],
  [["BU","Nuno","Gomes",78],["DD","Maxi","Pereira",77],["MDC/MC","Javi","García",76],["DC","","Luisão",81],["AG/MG","Nicolás","Gaitán",81],["DC","Ricardo","Gomes",80],["MOC/MC","Pablo","Aimar",84],["BU","Óscar","Cardozo",83],["DC","Humberto","Coelho",84],["AG/MG","","Simão",86],["MC/MOC","Mário","Coluna",87],["MOC/MC","Fernando","Chalana",86]]);

C("fcp", "FC Porto", "FCP", "XX", ["#003F87","#FFFFFF"], 3, ["Francesco","Farioli",81,86], `
G|Diogo|Costa|26|86|86
G|Cláudio|Ramos|34|73|73
G|João|Costa|30|69|69
MC/MOC|Victor|Froholdt|20|82|90
DC|Jakub|Kiwior|26|82|82
DC|Jan|Bednarek|29|82|82
BU|Samu|Aghehowa|22|80|85
MDC/MC|Alan|Varela|24|80|82
MC/MOC|Gabri|Veiga|24|80|82
DD|Alberto|Costa|22|78|83
MDC/MC|Pablo|Rosario|28|78|78
AD/MD|William|Gomes|20|77|85
AD/MD||Pepê|28|77|77
BU|André|Silva|30|77|77
DD|Martim|Fernandes|19|76|86
DC|Nehuén|Pérez|25|76|77
AG/MG|Borja|Sainz|25|76|77
DG|Francisco|Moura|26|76|76
MC/MDC|In-beom|Hwang|29|76|76
MOC/MC|Iván|Jaime|25|76|77|*
MDC/MC|Stephen|Eustaquio|28|74|74
MG/AG|Oskar|Pietuszewski|18|74|86
DG|Zaidu|Sanusi|28|74|74
DC|Dominik|Prpić|22|73|78
BU|Deniz|Gül|21|72|78`,
  [["DC","","Pepe",86],["AD/MD","Rabah","Madjer",86],["MOC/MC","","Deco",90]],
  [["MC/MOC","Raul","Meireles",78],["AD/MD","Silvestre","Varela",76],["DD","Paulinho","Santos",76],["MC/MOC","Lucho","González",81],["MC/MOC","","Maniche",81],["BU","Benni","McCarthy",80],["G","Vítor","Baía",85],["BU","Fernando","Gomes",85],["DC","Jorge","Costa",83],["BU","Mário","Jardel",87],["BU","Lisandro","López",85],["MOC/MC","António","Oliveira",86]]);

C("scp", "Sporting CP", "SCP", "XX", ["#008057","#FFFFFF"], 3, ["Rui","Borges",80,83], `
G|Rui|Silva|32|81|81
G|João|Virgínia|26|72|72
G|Diego|Callai|22|68|73
BU|Luis|Suárez|28|82|82
MG/AG|Pedro|Gonçalves|28|82|82
MOC/MC|Rodrigo|Zalazar|27|82|82
MG/AG|Maxi|Araújo|26|81|81
DC|Gonçalo|Inácio|25|80|81
MD/AD|Geny|Catamo|25|79|80
DC|Zeno|Debast|22|78|83
DC|Eduardo|Quaresma|24|78|80
MDC/MC|Sergi|Altimira|25|77|78
MC/MDC|Daniel|Bragança|26|77|77
DD|Iván|Fresneda|21|76|82
BU|Fotis|Ioannidis|26|76|76
DD|Georgios|Vagiannidis|25|75|76
MG/AG|Nuno|Santos|31|75|75
MDC/MC|Silas|Andersen|22|74|79
MC/MDC|Issa|Doumbia|22|73|78
MG/AG|Luís|Guilherme|19|72|82
DC|Ibrahima|Ba|21|72|78
MC/MDC|Koba|Koindredi|24|72|74|*
MC/MDC|João|Simões|19|70|80
MC/MDC|Pedro|Lima|23|69|72
BU|Rafael|Nel|20|68|76`,
  [["AD/MD","","Nani",84],["BU","Fernando","Peyroteo",88],["AD/MD","Luís","Figo",91]],
  [["BU","","Liédson",78],["DC","Anderson","Polga",77],["MDC/MC","Miguel","Veloso",77],["AG/MG","Ricardo Sá","Pinto",80],["MC/MOC","Hugo","Viana",80],["DG","Rui","Jorge",80],["G","Rui","Patrício",84],["MDC/MC","Paulo","Bento",83],["MOC/MC","João","Pinto",84],["AG/MG","Paulo","Futre",86],["BU","Manuel","Fernandes",86],["DG","","Hilário",85]]);

C("gs", "Galatasaray", "GS", "XX", ["#A90432","#FDB912"], 3, ["Okan","Buruk",81,82], `
G|Uğurcan|Çakır|30|80|80
G|Günay|Güvenç|35|72|72
G|Enes Emre|Büyük|20|66|74|*
BU|Victor|Osimhen|27|85|85
AG/MG|Rafael|Leão|27|83|83
MDC/MC|Lucas|Torreira|30|81|81
MG/AG|Barış Alper|Yılmaz|26|80|80
MD/AD|Leroy|Sané|30|80|80
MC/MOC|Gabriel|Sara|27|80|80
DC|Davinson|Sánchez|30|80|80
MG/AG|Noa|Lang|27|79|79
MOC/MC|Yunus|Akgün|26|79|79
DC|Abdülkerim|Bardakcı|32|79|79
DC|Wilfried|Singo|25|78|79
DD|Roland|Sallai|29|78|78
MC/MOC|İlkay|Gündoğan|35|78|78
MDC/MC|Lesley|Ugochukwu|22|76|81
DC|El Chadaille|Bitshiabu|21|75|81|*
DG|Eren|Elmalı|26|75|75
DG|Ismail|Jakobs|27|75|75
MDC/MC|Kaan|Ayhan|31|73|73
DG|Kazımcan|Karataş|23|67|70
MC/MDC|Renato|Nhaga|19|64|74
MDC/MC|Eyüp|Aydın|22|64|69`,
  [["G","Fernando","Muslera",84],["BU","Metin","Oktay",87],["MOC/MC","Gheorghe","Hagi",91]],
  [["DG","Hakan","Balta",76],["MD/AD","Ümit","Davala",77],["MC/MOC","Selçuk","İnan",77],["DD","Sabri","Sarıoğlu",80],["MC/MDC","Tugay","Kerimoğlu",81],["MDC/MC","Felipe","Melo",81],["DC","Bülent","Korkmaz",84],["DC","Gheorghe","Popescu",84],["AG/MG","Hasan","Şaş",84],["BU","Hakan","Şükür",87],["G","Cláudio","Taffarel",86],["AG/MG","Lukas","Podolski",85]]);

C("fb", "Fenerbahçe", "FB", "XX", ["#FFED00","#002D72"], 3, ["İsmail","Kartal",77,78], `
G||Ederson|32|82|82
G|Mert|Günok|37|73|73
G|Tarık|Çetin|28|69|69
MD/AD|Mason|Greenwood|24|83|85
MDC/MC|N'Golo|Kanté|34|83|83
MOC/MC|Marco|Asensio|29|82|82
BU|Romelu|Lukaku|32|82|82
MDC/MC|Mattéo|Guendouzi|27|81|81
BU|Vedat|Muriqi|31|81|81
DC|Milan|Škriniar|31|81|81
DC|Nathan|Aké|31|80|80
MG/AG|Kerem|Aktürkoğlu|27|79|79
MDC/MC|Edson|Álvarez|28|79|79|*
MDC/MC|İsmail|Yüksek|27|77|77
DD|Nélson|Semedo|32|77|77
DC|Jayden|Oosterwolde|25|76|77
MD/AD|Dorgeles|Nene|23|75|78
MG/AG|Oğuz|Aydın|25|74|75
DC|Çağlar|Söyüncü|30|74|74
MD/AD|İrfan Can|Kahveci|30|74|74
DD|Mert|Müldür|26|73|73
DG|Archie|Brown|24|73|75
DC|Kojo Peprah|Oppong|22|73|78|*
DG|Levent|Mercan|24|73|75
MC/MDC|Mert Hakan|Yandaş|31|73|73|*`,
  [["MC/MOC","Emre","Belözoğlu",84],["BU","Lefter","Küçükandonyadis",87],["MOC/MC","Alex","de Souza",91]],
  [["G","Volkan","Demirel",78],["MC/MDC","Selçuk","Şahin",76],["DD","Gökhan","Gönül",77],["BU","Pierre","van Hooijdonk",81],["MDC/MC","Mehmet","Aurélio",80],["BU","Mateja","Kežman",80],["BU","Nicolas","Anelka",84],["BU","Moussa","Sow",83],["DC","Diego","Lugano",84],["G","Rüştü","Reçber",86],["AG/MG","Tuncay","Şanlı",85],["BU","Aykut","Kocaman",86]]);

C("aja", "Ajax", "AJA", "XX", ["#D2122E","#FFFFFF"], 2, ["Míchel","Sánchez",79,80], `
G|Marc-André|ter Stegen|34|82|82|*
G|Maarten|Paes|28|74|74|*
G|Joeri|Heerkens|20|60|68|*
AG/MG|Mika|Godts|20|80|88|*
MOC/MC|Julian|Brandt|30|80|80|*
MOC/MC|Oscar|Gloukh|22|79|84|*
MDC/MC|Sofyan|Amrabat|30|79|79
AD/MD|Viktor|Tsygankov|28|78|78|*
DC|Youri|Baas|23|77|80|*
AG/MG|Simon|Adingra|24|77|79|*
BU|Kasper|Dolberg|28|77|77|*
DC|Thilo|Kehrer|30|77|77
DC|Caio|Henrique|29|77|77|*
MDC/MC|Yves|Bissouma|30|77|77|*
BU|Tolu|Arokodare|25|76|77|*
BU|Marcos|Leonardo|23|76|79|*
DD|Anton|Gaaei|23|75|78|*
MC/MDC|Youri|Regeer|23|74|77|*
AD/MD|Oliver|Edvardsen|27|74|74|*
MDC/MC|Jorthy|Mokio|18|73|85|*
DD|Lucas|Rosa|26|73|73|*
DC|Daley|Blind|36|73|73|*
AD/MD|Steven|Berghuis|34|73|73|*
DG|Owen|Wijndal|26|72|72|*
MC/MOC|Davy|Klaassen|33|72|72|*`,
  [["AD/MD","Dušan","Tadić",85],["BU","Dennis","Bergkamp",89],["BU","Johan","Cruyff",95]],
  [["MC/MOC","Siem","de Jong",77],["DC","Jan","Vertonghen",78],["MC/MOC","Lasse","Schöne",77],["MOC/MC","Jari","Litmanen",82],["BU","Klaas-Jan","Huntelaar",82],["DC","Danny","Blind",81],["MDC/MC","Frank","Rijkaard",85],["AG/MG","Marc","Overmars",84],["MC/MOC","Ronald","de Boer",83],["G","Edwin","van der Sar",88],["MC/MOC","Johan","Neeskens",87],["AG/MG","Piet","Keizer",86]]);

C("psv", "PSV Eindhoven", "PSV", "XX", ["#ED1C24","#FFFFFF"], 2, ["Peter","Bosz",80,80], `
G|Matej|Kovar|25|77|78
G|Nick|Olij|30|75|75
G|Tijn|Smolenaars|21|62|68
DG|Mauro|Júnior|26|81|81
AG/MG|Ivan|Perisic|37|81|81
DC|Jerdy|Schouten|29|80|80
DD|Sergiño|Dest|25|79|80
BU|Ricardo|Pepi|23|78|81
MOC/MC|Guus|Til|27|78|78
DC|Lutsharel|Geertruida|25|78|79
DC|Yarek|Gasiorowski|21|77|83
AD/MD|Dennis|Man|27|77|77
MOC/MC|Sven|Mijnans|26|77|77
MC/MDC|Kodai|Sano|23|77|80
BU|Alassane|Pléa|33|77|77
DG|Filip|Kostic|33|77|77
MOC/MC|Paul|Wanner|20|76|84
DC|Ryan|Flamingo|23|76|79
AG/MG|Ruben|van Bommel|21|74|80
AD/MD|Esmir|Bajraktarevic|20|74|82
DC|Armando|Obispo|26|74|74
AG/MG|Couhaib|Driouech|24|72|74
DD|Kiliann|Sildillia|24|72|74
MOC/MC|Isaac|Babadi|20|67|75
MOC/MC|Noah|Fernandez|18|67|79`,
  [["MC/MDC","Phillip","Cocu",85],["BU","Willy","van der Kuijlen",86],["BU","","Romário",91]],
  [["MOC/MC","Ibrahim","Afellay",78],["DC","André","Ooijer",76],["DG","Wilfred","Bouma",77],["MDC/MC","Mark","van Bommel",81],["AD/MD","Jefferson","Farfán",80],["BU","Jan","Vennegoor of Hesselink",80],["BU","Ruud","van Nistelrooy",85],["MC/MOC","Gerald","Vanenburg",83],["G","Hans","van Breukelen",84],["DC","Ronald","Koeman",87],["DD","Eric","Gerets",86],["BU","Wim","Kieft",85]]);

C("mia", "Inter Miami", "MIA", "XX", ["#F7B5CD","#231F20"], 2, ["Javier","Mascherano",74,79], `
G|Dayne|St. Clair|29|73|73
G|Luis|Barraza|29|64|64
G|Rocco Ríos|Novo|24|63|65
MOC/MC|Lionel|Messi|39|89|89
MC/MDC|Rodrigo|De Paul|32|83|83
MDC/MC||Casemiro|34|83|83|*
BU|Luis|Suárez|39|78|78
BU|Germán|Berterame|27|77|77
DG|Sergio|Reguilón|29|72|72
MC/MOC|Telasco|Segovia|23|71|74
DD|Facundo|Mura|27|71|71
MD/AD|Tadeo|Allende|27|71|71
MDC/MC|Yannick|Bright|25|71|72
DC||Micael|26|69|69
MDC/MC|David|Ayala|23|68|71
DG|Noah|Allen|22|68|73
DC|Maximiliano|Falcón|29|68|68
DC|Gonzalo|Luján|25|68|69
DD|Ian|Fray|24|66|68
MD/AD|Mateo|Silvetti|20|65|73
MC/MDC|David|Ruíz|22|62|67`,
  [["DG","Jordi","Alba",85],["BU","Gonzalo","Higuaín",85],["MDC/MC","Sergio","Busquets",88]],
  [["MOC/MC","Lee","Nguyen",73],["BU","Juan","Agudelo",73],["DC","Christian","Makoun",72],["DC","Ryan","Shawcross",75],["DG","Kieran","Gibbs",76],["MG/AG","Lewis","Morgan",76],["DD","DeAndre","Yedlin",77],["DC","Leandro González","Pírez",78],["BU","Josef","Martínez",78],["MOC/MC","Rodolfo","Pizarro",79],["MC/MDC","Blaise","Matuidi",81],["MOC/MC","Alejandro","Pozuelo",79]]);

C("bjk", "Beşiktaş", "BJK", "XX", ["#000000","#FFFFFF"], 2, ["Vincenzo","Italiano",79,81], `
G|Alexander|Nübel|29|80|80
G|Doğan|Alemdar|23|68|71
G|Emir|Yaşar|19|58|68
AG/MG|Leandro|Trossard|30|82|82
MC/MOC|Orkun|Kökçü|25|82|83
BU|Dušan|Vlahović|26|81|81
DC|Emmanuel|Agbadou|29|77|77
MD/AD|Vaclav|Cerny|28|77|77
BU|Hyeon-gyu|Oh|24|75|77
MC/MOC|Fabio|Miretti|23|75|78
MDC/MC|Wilfred|Ndidi|29|75|75
DD|Amir|Murillo|29|74|74
MDC/MC|Salih|Özcan|28|74|74
DC|Tiago|Djaló|26|74|74
DC|Emirhan|Topçu|25|74|75
MD/AD|Milot|Rashica|29|74|74
BU|Semih|Kılıçsoy|20|73|81
DG|Kassoum|Ouattara|21|72|78
DG|Rıdvan|Yılmaz|25|72|73
MG/AG|Junior|Olaitan|24|71|73
MDC/MC|Amir|Hadziahmetovic|28|71|71
MDC/MC|Kartal|Yılmaz|25|69|70
BU|Mustafa|Hekimoğlu|19|67|77
DD|Taylan|Bulut|20|67|75
MD/AD|Can|Keleş|24|66|68`,
  [["AD/MD","Ricardo","Quaresma",85],["BU","Feyyaz","Uçar",85],["BU","Hakkı","Yeten",88]],
  [["MC/MOC","Oğuzhan","Özyakup",77],["DC","İbrahim","Toraman",76],["AD/MD","Gökhan","Töre",77],["MOC/MC","Sergen","Yalçın",82],["MC/MDC","Tayfur","Havutçu",80],["BU","Demba","Ba",81],["DC","Rıza","Çalımbay",84],["BU","Pascal","Nouma",83],["BU","Daniel","Amokachi",83],["AG/MG","Metin","Tekin",85],["BU","Ertuğrul","Sağlam",85],["BU","","Bobô",85]]);

C("ts", "Trabzonspor", "TS", "XX", ["#7A1B34","#7DC1E8"], 1, ["Thomas","Reis",75,77], `
G|André|Onana|30|78|78
G|Onuralp|Çevikkan|19|62|72
G|Ahmet|Yıldırım|19|57|67
MD/AD|Mohamed|Salah|33|87|87
MDC/MC||Fabinho|32|82|82
BU|Paul|Onuachu|31|77|77
DC|Arseniy|Batagov|24|76|78
AG/MG|Aral|Şimşir|24|76|78
DC|Stefan|Savić|35|76|76
MOC/MC|Ernest|Muci|25|75|76
MDC/MC|Batista|Mendy|26|75|75
MC/MOC|Ruslan|Malinovskyi|33|75|75
DC|Cenk|Özkacar|25|72|73
DD|Wagner|Pina|23|72|75
DC|Chibuike|Nwaiwu|22|72|77
MDC/MC|Tim|Jabol-Folcarelli|26|72|72
DG|Mustafa|Eskihellaç|29|72|72
MDC/MC|Okay|Yokuşlu|32|72|72
MDC/MC|Ozan|Tufan|31|72|72
DC|Samet|Akaydin|32|72|72
DD|Sidny Lopes|Cabral|23|71|74
MG/AG|Noah|Saviolo|22|69|74
BU|Umut|Nayir|32|69|69
MC/MDC|Benjamin|Bouchouari|24|68|70
MDC/MC|Melih|Kabasakal|29|68|68`,
  [["BU","Burak","Yılmaz",84],["MOC/MC","Hami","Mandıralı",85],["G","Şenol","Güneş",88]],
  [["G","Onur","Kıvrak",76],["DG","Serkan","Balcı",75],["AD/MD","Ibrahima","Yattara",76],["MOC/MC","Gökdeniz","Karadeniz",80],["BU","Fatih","Tekke",80],["MC/MOC","Ünal","Karaman",80],["BU","Şota","Arveladze",82],["DD","José","Bosingwa",82],["MOC/MC","Tolunay","Kafkas",82],["BU","Necmi","Perekli",85],["DC","Ogün","Temizkanoğlu",84],["DC","Hüseyin","Tok",84]]);

// ---------- BASE SUPPLÉMENTAIRE (enchères) : joueurs hors des 30 clubs ----------
`G|Marco|Carnesecchi|26|86|86|Atalanta
MOC/MC|Paulo|Dybala|32|85|85|AS Roma
G|Jordan|Pickford|32|85|85|Everton
G|Mile|Svilar|27|85|85|AS Roma
G|Emiliano|Martínez|34|85|85|Aston Villa
MDC/MC|Rúben|Neves|29|85|85|Al-Hilal
G|Unai|Simón|29|85|85|Athletic Club
MDC/MC|Granit|Xhaka|34|85|85|Sunderland
AG/MG|Gabriel|Martinelli|25|80|81|Al-Hilal
BU|Ollie|Watkins|30|83|83|Aston Villa
AG/MG|Nico|Williams|24|84|86|Athletic Club
MOC/MC|Oihan|Sancet|26|82|82|Athletic Club
BU|Mikel|Oyarzabal|29|83|83|Real Sociedad
MOC/MC|Nico|Paz|22|82|87|Côme
BU|Deniz|Undav|30|82|82|Stuttgart
BU|Karim|Benzema|38|84|84|Al-Ittihad
AG/MG|Sadio|Mané|34|81|81|Al-Nassr
AG/MG||Neymar|34|82|82|Santos
DC|Kalidou|Koulibaly|35|80|80|Al-Hilal
MOC/MC|Hákon Arnar|Haraldsson|23|81|84|Lille
G|Bart|Verbruggen|24|82|84|Brighton
MDC/MC|Carlos|Baleba|22|80|85|Brighton
AD/MD|Kaoru|Mitoma|29|81|81|Brighton
MC/MDC|Adam|Wharton|22|81|86|Crystal Palace
BU|Jonathan|Burkardt|26|80|80|Francfort`.split('\n').forEach(function (line, i) {
  var d = parseLine(line.trim());
  d.id = 'x-' + (i + 1); d.club = null; d.kind = 'pool';
  PLAYERS[d.id] = d; POOL_IDS.push(d.id);
});

// ---------- ENTRAÎNEURS LIBRES (dans le jeu) ----------
[["Pep","Guardiola",93,93],["Jürgen","Klopp",91,91],["Zinédine","Zidane",89,89],["Antonio","Conte",88,88],["Arne","Slot",86,88],["Xavi","Hernández",81,84],["Thomas","Frank",80,83],["Erik","ten Hag",79,79],["Thiago","Motta",78,82],["Liam","Rosenior",77,84],["Kasper","Hjulmand",78,79]].forEach(function (m, i) {
  var id = 'm-f' + (i + 1);
  MANAGERS[id] = { id: id, fn: m[0], ln: m[1], tac: m[2], pot: m[3], val: mgrPrice(m[2], m[3]), club: null };
  FREE_MGR_IDS.push(id);
});

// ---------- PRIX DES JOUEURS ----------
// Le joueur le mieux noté de chaque ligne vaut le prix de référence : attaquant 200 M€, milieu 175 M€,
// défenseur 150 M€, gardien 125 M€. Chaque point de note en moins retire environ 17 % ;
// puis on ajuste selon l'âge (les plus de 30 ans valent moins) et la marge de progression (potentiel − note).
var LINE_OF = { BU: 'A', AD: 'A', AG: 'A', MOC: 'M', MC: 'M', MDC: 'M', MD: 'M', MG: 'M', DC: 'D', DD: 'D', DG: 'D', G: 'G' };
var VAL_TOP = { A: 200, M: 175, D: 150, G: 125 };
var VAL_K = 0.19;
var VAL_MAX = { A: 0, M: 0, D: 0, G: 0 };
Object.keys(PLAYERS).forEach(function (k) {
  var p = PLAYERS[k];
  if (p.kind !== 'club' && p.kind !== 'pool') return;
  var l = LINE_OF[p.pos]; if (p.ovr > VAL_MAX[l]) VAL_MAX[l] = p.ovr;
});
function ageFactor(pos, age) {
  if (!age) return 1;
  if (pos === 'G') return age <= 24 ? 1.05 : age <= 31 ? 1 : age <= 33 ? 0.8 : age <= 35 ? 0.6 : 0.4;
  return age <= 21 ? 1.1 : age <= 24 ? 1.05 : age <= 28 ? 1 : age <= 30 ? 0.85 : age <= 32 ? 0.65 : age <= 34 ? 0.45 : 0.3;
}
function roundVal(v) { return v >= 10 ? Math.round(v) : Math.max(0.3, Math.round(v * 10) / 10); }
function valueOf(pos, ovr, age, pot) {
  var l = LINE_OF[pos] || 'M', top = VAL_TOP[l];
  if (ovr >= VAL_MAX[l]) return top;
  var v = top * Math.exp(-VAL_K * (VAL_MAX[l] - ovr)) * ageFactor(pos, age) * (1 + 0.02 * Math.max(0, (pot || ovr) - ovr));
  return roundVal(Math.min(top, v));
}
Object.keys(PLAYERS).forEach(function (k) { var p = PLAYERS[k]; p.val = valueOf(p.pos, p.ovr, p.age, p.pot); });
