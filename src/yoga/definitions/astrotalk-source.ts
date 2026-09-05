// Source row identities from https://astrotalk.com/astrology-yoga (2026-09-05).
// Equal names AND equal result descriptions share an ID. Formation text is not
// the grouping key. IDs of previously published definitions are preserved.
export const astrotalkSourceRows: readonly {
  readonly row: number;
  readonly id: string;
  readonly excluded: boolean;
}[] = [
  { row: 1, id: "gajakesari", excluded: false }, // Gajakesari Yoga
  { row: 2, id: "sunapha", excluded: false }, // Sunapha Yoga
  { row: 3, id: "anapha", excluded: false }, // Anapha Yoga
  { row: 4, id: "dhurdhua", excluded: false }, // Dhurdhua Yoga
  { row: 5, id: "kemadruma", excluded: false }, // Kemadruma Yoga
  { row: 6, id: "chandra_mangala", excluded: false }, // Chandra Mangala Yoga
  { row: 7, id: "adhi", excluded: false }, // Adhi Yoga
  { row: 8, id: "chatussagara", excluded: false }, // Chatussagara Yoga
  { row: 9, id: "vasumathi", excluded: false }, // Vasumathi Yoga
  { row: 10, id: "rajalakshana", excluded: false }, // Rajalakshana Yoga
  { row: 11, id: "vanchana_chora_bheethi", excluded: true }, // Vanchana Chora Bheethi Yoga
  { row: 12, id: "sakata", excluded: false }, // Sakata Yoga
  { row: 13, id: "amala", excluded: false }, // Amala Yoga
  { row: 14, id: "parvata", excluded: false }, // Parvata Yoga
  { row: 15, id: "kahala", excluded: false }, // Kahala Yoga
  { row: 16, id: "vesi", excluded: false }, // Vesi Yoga
  { row: 17, id: "vasi", excluded: false }, // Vasi Yoga
  { row: 18, id: "obhayachari", excluded: false }, // Obhayachari Yoga
  { row: 19, id: "hamsa", excluded: false }, // Hamsa Yoga
  { row: 20, id: "malavya", excluded: false }, // Malavya Yoga
  { row: 21, id: "sasa", excluded: false }, // Sasa Yoga
  { row: 22, id: "ruchaka", excluded: false }, // Ruchaka Yoga
  { row: 23, id: "bhadra", excluded: false }, // Bhadra Yoga
  { row: 24, id: "budha_aditya", excluded: false }, // Budha-Aditya Yoga
  { row: 25, id: "mahabhagya", excluded: false }, // Mahabhagya Yoga
  { row: 26, id: "pushkala", excluded: false }, // Pushkala Yoga
  { row: 27, id: "lakshmi", excluded: false }, // Lakshmi Yoga
  { row: 28, id: "gauri", excluded: false }, // Gauri Yoga
  { row: 29, id: "bharathi", excluded: false }, // Bharathi Yoga
  { row: 30, id: "chapa_exchange", excluded: false }, // Chapa Yoga
  { row: 31, id: "sreenatha", excluded: false }, // Sreenatha yoga
  { row: 32, id: "lagna_malika", excluded: false }, // Lagna Malika
  { row: 33, id: "dhana_malika", excluded: false }, // Dhana Malika
  { row: 34, id: "vikrama_malika", excluded: false }, // Vikrama Malika
  { row: 35, id: "sukha_malika", excluded: false }, // Sukha Malika
  { row: 36, id: "putra_malika", excluded: false }, // Putra Malika
  { row: 37, id: "satru_malika", excluded: false }, // Satru Malika
  { row: 38, id: "kalatra_malika", excluded: false }, // Kalatra Malika
  { row: 39, id: "randhra_malika", excluded: false }, // Randhra Malika
  { row: 40, id: "bhagya_malika", excluded: false }, // Bhagya Malika
  { row: 41, id: "karma_malika", excluded: false }, // Karma Malika
  { row: 42, id: "labha_malika", excluded: false }, // Labha Malika
  { row: 43, id: "vraya_malika", excluded: false }, // Vraya Malika
  { row: 44, id: "sankha", excluded: false }, // Sankha Yoga
  { row: 45, id: "bheri", excluded: false }, // Bheri Yoga
  { row: 46, id: "mridanga", excluded: false }, // Mridanga Yoga
  { row: 47, id: "parijatha", excluded: false }, // Parijatha Yoga
  { row: 48, id: "gaja", excluded: false }, // Gaja Yoga
  { row: 49, id: "kalanidhi", excluded: false }, // Kalanidhi Yoga
  { row: 50, id: "amsavatara", excluded: false }, // Amsavatara Yoga
  { row: 51, id: "harihara_brahma", excluded: false }, // Harihara Brahma Yoga
  { row: 52, id: "kusuma", excluded: false }, // Kusuma Yoga
  { row: 53, id: "matsya", excluded: false }, // Matsya Yoga
  { row: 54, id: "kurma", excluded: false }, // Kurma Yoga
  { row: 55, id: "devendra", excluded: false }, // Devendra Yoga
  { row: 56, id: "makuta", excluded: false }, // Makuta Yoga
  { row: 57, id: "chandika", excluded: false }, // Chandika Yoga
  { row: 58, id: "jaya", excluded: false }, // Jaya Yoga
  { row: 59, id: "vidyut", excluded: false }, // Vidyut Yoga
  { row: 60, id: "gandharva", excluded: false }, // Gandharva Yoga
  { row: 61, id: "siva", excluded: false }, // Siva Yoga
  { row: 62, id: "vishnu", excluded: false }, // Vishnu Yoga
  { row: 63, id: "brahma", excluded: false }, // Brahma Yoga
  { row: 64, id: "indra", excluded: false }, // Indra Yoga
  { row: 65, id: "ravi", excluded: false }, // Ravi Yoga
  { row: 66, id: "garuda", excluded: false }, // Garuda Yoga
  { row: 67, id: "go", excluded: false }, // Go Yoga
  { row: 68, id: "gola_yoga", excluded: false }, // Gola Yoga
  { row: 69, id: "thrilochana", excluded: false }, // Thrilochana Yoga
  { row: 70, id: "kulavardhana", excluded: false }, // Kulavardhana Yoga
  { row: 71, id: "yupa", excluded: false }, // Yupa Yoga
  { row: 72, id: "ishu", excluded: false }, // Ishu Yoga
  { row: 73, id: "sakti", excluded: false }, // Sakti Yoga
  { row: 74, id: "danda", excluded: false }, // Danda Yoga
  { row: 75, id: "nav", excluded: false }, // Nav Yoga
  { row: 76, id: "kuta", excluded: false }, // Kuta Yoga
  { row: 77, id: "chhatra", excluded: false }, // Chhatra Yoga
  { row: 78, id: "chapa_continuous", excluded: false }, // Chapa Yoga
  { row: 79, id: "ardha_chandra", excluded: false }, // Ardha Chandra Yoga
  { row: 80, id: "chandra", excluded: false }, // Chandra Yoga
  { row: 81, id: "gada", excluded: false }, // Gada Yoga
  { row: 82, id: "sakata_nabhasa", excluded: false }, // Sakata Yoga
  { row: 83, id: "vihaga", excluded: false }, // Vihaga Yoga
  { row: 84, id: "vajra", excluded: false }, // Vajra Yoga
  { row: 85, id: "yava", excluded: false }, // Yava Yoga
  { row: 86, id: "sringhataka", excluded: false }, // Sringhataka Yoga
  { row: 87, id: "hala", excluded: false }, // Hala Yoga
  { row: 88, id: "kamala", excluded: false }, // Kamala Yoga
  { row: 89, id: "vapee", excluded: false }, // Vapee Yoga
  { row: 90, id: "samudra", excluded: false }, // Samudra Yoga
  { row: 91, id: "vallaki", excluded: false }, // Vallaki Yoga
  { row: 92, id: "damni", excluded: false }, // Damni Yoga
  { row: 93, id: "pasa", excluded: false }, // Pasa Yoga
  { row: 94, id: "kedara", excluded: false }, // Kedara Yoga
  { row: 95, id: "sula", excluded: false }, // Sula Yoga
  { row: 96, id: "yuga", excluded: false }, // Yuga Yoga
  { row: 97, id: "gola_yoga", excluded: false }, // Gola Yoga
  { row: 98, id: "rajju", excluded: false }, // Rajju Yoga
  { row: 99, id: "musala", excluded: false }, // Musala Yoga
  { row: 100, id: "nala", excluded: false }, // Nala Yoga
  { row: 101, id: "srik", excluded: false }, // Srik Yoga
  { row: 102, id: "sarpa", excluded: false }, // Sarpa Yoga
  { row: 103, id: "duryoga", excluded: false }, // Duryoga
  { row: 104, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 105, id: "harsha", excluded: false }, // Harsha Yoga
  { row: 106, id: "sarala", excluded: false }, // Sarala Yoga
  { row: 107, id: "vimala", excluded: false }, // Vimala Yoga
  { row: 108, id: "sareera_soukhya", excluded: false }, // Sareera Soukhya Yoga
  { row: 109, id: "dehapushti", excluded: false }, // Dehapushti Yoga
  { row: 110, id: "dehakashta", excluded: false }, // Dehakashta Yoga
  { row: 111, id: "rogagrastha", excluded: false }, // Rogagrastha Yoga
  { row: 112, id: "krisanga", excluded: false }, // Krisanga Yoga
  { row: 113, id: "krisanga", excluded: false }, // Krisanga Yoga
  { row: 114, id: "dehasthoulya", excluded: false }, // Dehasthoulya Yoga
  { row: 115, id: "dehasthoulya", excluded: false }, // Dehasthoulya Yoga
  { row: 116, id: "dehasthoulya", excluded: false }, // Dehasthoulya Yoga
  { row: 117, id: "sada_sanchara", excluded: false }, // Sada Sanchara Yoga
  { row: 118, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 119, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 120, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 121, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 122, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 123, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 124, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 125, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 126, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 127, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 128, id: "dhana", excluded: false }, // Dhana Yoga
  { row: 129, id: "bahudravyarjana", excluded: false }, // Bahudravyarjana Yoga
  { row: 130, id: "swaveeryaddhana", excluded: false }, // Swaveeryaddhana Yoga
  { row: 131, id: "swaveeryaddhana", excluded: false }, // Swaveeryaddhana Yoga
  { row: 132, id: "swaveeryaddhana", excluded: false }, // Swaveeryaddhana Yoga
  { row: 133, id: "madhya_vayasi_dhana", excluded: false }, // Madhya Vayasi Dhana Yoga
  { row: 134, id: "anthya_vayasi_dhana", excluded: false }, // Anthya Vayasi Dhana Yoga
  { row: 135, id: "balya_dhana", excluded: false }, // Balya Dhana Yoga
  { row: 136, id: "bhratrumooladdhanaprapti", excluded: false }, // Bhratrumooladdhanaprapti Yoga
  { row: 137, id: "bhratrumooladdhanaprapti", excluded: false }, // Bhratrumooladdhanaprapti Yoga
  { row: 138, id: "matrumooladdhana", excluded: false }, // Matrumooladdhana Yoga
  { row: 139, id: "putramooladdhana", excluded: false }, // Putramooladdhana Yoga
  { row: 140, id: "satrumooladdhana", excluded: false }, // Satrumooladdhana Yoga
  { row: 141, id: "kalatramooladdhana", excluded: false }, // Kalatramooladdhana Yoga
  { row: 142, id: "amaranantha_dhana", excluded: false }, // Amaranantha Dhana Yoga
  { row: 143, id: "ayatnadhanalabha", excluded: false }, // Ayatnadhanalabha Yoga
  { row: 144, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 145, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 146, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 147, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 148, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 149, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 150, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 151, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 152, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 153, id: "daridra", excluded: false }, // Daridra Yoga
  { row: 154, id: "yukthi_samanwithavagmi", excluded: false }, // Yukthi Samanwithavagmi Yoga
  { row: 155, id: "yukthi_samanwithavagmi", excluded: false }, // Yukthi Samanwithavagmi Yoga
  { row: 156, id: "parihasaka", excluded: false }, // Parihasaka Yoga
  { row: 157, id: "asatyavadi", excluded: false }, // Asatyavadi Yoga
  { row: 158, id: "jada", excluded: true }, // Jada Yoga
  { row: 159, id: "bhaskara", excluded: false }, // Bhaskara Yoga
  { row: 160, id: "marud", excluded: false }, // Marud Yoga
  { row: 161, id: "saraswathi", excluded: false }, // Saraswathi Yoga
  { row: 162, id: "budha", excluded: false }, // Budha Yoga
  { row: 163, id: "mooka", excluded: false }, // Mooka Yoga
  { row: 164, id: "netranasa", excluded: false }, // Netranasa Yoga
  { row: 165, id: "andha", excluded: false }, // Andha Yoga
  { row: 166, id: "sumukha", excluded: false }, // Sumukha Yoga
  { row: 167, id: "sumukha", excluded: false }, // Sumukha Yoga
  { row: 168, id: "durmukha", excluded: false }, // Durmukha Yoga
  { row: 169, id: "durmukha", excluded: true }, // Durmukha Yoga
  { row: 170, id: "bhojana_soukhya", excluded: false }, // Bhojana Soukhya Yoga
  { row: 171, id: "annadana", excluded: false }, // Annadana Yoga
  { row: 172, id: "parannabhojana", excluded: false }, // Parannabhojana Yoga
  { row: 173, id: "sraddhannabhuktha", excluded: false }, // Sraddhannabhuktha Yoga
  { row: 174, id: "sarpaganda", excluded: true }, // Sarpaganda Yoga
  { row: 175, id: "vakchalana", excluded: false }, // Vakchalana Yoga
  { row: 176, id: "vishaprayoga", excluded: false }, // VishapraYoga Yoga
  { row: 177, id: "bhratruvriddhi", excluded: false }, // Bhratruvriddhi Yoga
  { row: 178, id: "sodaranasa", excluded: false }, // Sodaranasa Yoga
  { row: 179, id: "ekabhagini", excluded: false }, // Ekabhagini Yoga
  { row: 180, id: "dwadasa_sahodara", excluded: false }, // Dwadasa Sahodara Yoga
  { row: 181, id: "sapthasankhya_sahodara", excluded: false }, // Sapthasankhya Sahodara Yoga
  { row: 182, id: "parakrama", excluded: false }, // Parakrama Yoga
  { row: 183, id: "yuddha_praveena", excluded: false }, // Yuddha Praveena Yoga
  { row: 184, id: "yuddhatpoorvadridhachitta", excluded: false }, // Yuddhatpoorvadridhachitta Yoga
  { row: 185, id: "yuddhatpaschaddrudha", excluded: false }, // Yuddhatpaschaddrudha Yoga
  { row: 186, id: "satkathadisravana", excluded: false }, // Satkathadisravana Yoga
  { row: 187, id: "uttama_griha", excluded: false }, // Uttama Griha Yoga
  { row: 188, id: "vichitra_saudha_prakara", excluded: false }, // Vichitra Saudha Prakara Yoga
  { row: 189, id: "ayatna_griha_prapta", excluded: false }, // Ayatna Griha Prapta Yoga
  { row: 190, id: "ayatna_griha_prapta", excluded: false }, // Ayatna Griha Prapta Yoga
  { row: 191, id: "grihanasa", excluded: false }, // Grihanasa Yoga
  { row: 192, id: "grihanasa", excluded: false }, // Grihanasa Yoga
  { row: 193, id: "bandhu_pujya", excluded: false }, // Bandhu Pujya Yoga
  { row: 194, id: "bandhu_pujya_194", excluded: false }, // Bandhu Pujya Yoga
  { row: 195, id: "bandhubhisthyaktha", excluded: false }, // Bandhubhisthyaktha Yoga
  { row: 196, id: "matrudeerghayur", excluded: false }, // Matrudeerghayur Yoga
  { row: 197, id: "matrudeerghayur", excluded: false }, // Matrudeerghayur Yoga
  { row: 198, id: "matrunasa", excluded: false }, // Matrunasa Yoga
  { row: 199, id: "matrunasa", excluded: false }, // Matrunasa Yoga
  { row: 200, id: "matrugami", excluded: false }, // Matrugami Yoga
  { row: 201, id: "sahodareesangama", excluded: false }, // Sahodareesangama Yoga
  { row: 202, id: "kapata", excluded: false }, // Kapata Yoga
  { row: 203, id: "kapata_203", excluded: false }, // Kapata Yoga
  { row: 204, id: "kapata", excluded: true }, // Kapata Yoga
  { row: 205, id: "nishkapata", excluded: false }, // Nishkapata Yoga
  { row: 206, id: "nishkapata", excluded: false }, // Nishkapata Yoga
  { row: 207, id: "matru_satrutwa", excluded: false }, // Matru Satrutwa Yoga
  { row: 208, id: "matru_sneha", excluded: false }, // Matru Sneha Yoga
  { row: 209, id: "vahana", excluded: false }, // Vahana Yoga
  { row: 210, id: "vahana", excluded: false }, // Vahana Yoga
  { row: 211, id: "anapathya", excluded: false }, // Anapathya Yoga
  { row: 212, id: "sarpasapa", excluded: false }, // Sarpasapa Yoga
  { row: 213, id: "sarpasapa", excluded: false }, // Sarpasapa Yoga
  { row: 214, id: "sarpasapa", excluded: false }, // Sarpasapa Yoga
  { row: 215, id: "sarpasapa", excluded: false }, // Sarpasapa Yoga
  { row: 216, id: "pitrusapa_sutakshaya", excluded: false }, // Pitrusapa Sutakshaya Yoga
  { row: 217, id: "matrusapa_sutakshaya", excluded: false }, // Matrusapa Sutakshaya Yoga
  { row: 218, id: "bhratrusapa_sutakshaya", excluded: false }, // Bhratrusapa Sutakshaya Yoga
  { row: 219, id: "pretasapa", excluded: false }, // Pretasapa Yoga
  { row: 220, id: "bahuputra", excluded: false }, // Bahuputra Yoga
  { row: 221, id: "bahuputra", excluded: false }, // Bahuputra Yoga
  { row: 222, id: "dattaputra", excluded: false }, // Dattaputra Yoga
  { row: 223, id: "dattaputra", excluded: false }, // Dattaputra Yoga
  { row: 224, id: "aputra", excluded: false }, // Aputra Yoga
  { row: 225, id: "ekaputra", excluded: false }, // Ekaputra Yoga
  { row: 226, id: "suputra", excluded: false }, // Suputra Yoga
  { row: 227, id: "kalanirdesat_putra", excluded: false }, // Kalanirdesat Putra Yoga
  { row: 228, id: "kalanirdesat_putra_228", excluded: false }, // Kalanirdesat Putra Yoga
  { row: 229, id: "kalanirdesat_putranasa", excluded: false }, // Kalanirdesat Putranasa Yoga
  { row: 230, id: "kalanirdesat_putranasa_230", excluded: false }, // Kalanirdesat Putranasa Yoga
  { row: 231, id: "buddhimaturya", excluded: false }, // Buddhimaturya Yoga
  { row: 232, id: "theevrabuddhi", excluded: false }, // Theevrabuddhi Yoga
  { row: 233, id: "buddhi_jada", excluded: false }, // Buddhi Jada Yoga
  { row: 234, id: "thrikalagnana", excluded: false }, // Thrikalagnana Yoga
  { row: 235, id: "putra_sukha", excluded: false }, // Putra Sukha Yoga
  { row: 236, id: "jara", excluded: false }, // Jara Yoga
  { row: 237, id: "jarajaputra", excluded: false }, // Jarajaputra Yoga
  { row: 238, id: "bahu_stree", excluded: false }, // Bahu Stree Yoga
  { row: 239, id: "satkalatra", excluded: false }, // Satkalatra Yoga
  { row: 240, id: "bhaga_chumbana", excluded: false }, // Bhaga Chumbana Yoga
  { row: 241, id: "bhagya", excluded: false }, // Bhagya Yoga
  { row: 242, id: "jananatpurvam_pitru_marana", excluded: false }, // Jananatpurvam Pitru Marana Yoga
  { row: 243, id: "dhatrutwa", excluded: false }, // Dhatrutwa Yoga
  { row: 244, id: "apakeerti", excluded: false }, // Apakeerti Yoga
  { row: 245, id: "raja", excluded: false }, // Raja Yoga
  { row: 246, id: "raja", excluded: false }, // Raja Yoga
  { row: 247, id: "raja", excluded: false }, // Raja Yoga
  { row: 248, id: "raja", excluded: false }, // Raja Yoga
  { row: 249, id: "raja", excluded: false }, // Raja Yoga
  { row: 250, id: "raja", excluded: false }, // Raja Yoga
  { row: 251, id: "raja", excluded: false }, // Raja Yoga
  { row: 252, id: "raja", excluded: false }, // Raja Yoga
  { row: 253, id: "raja", excluded: false }, // Raja Yoga
  { row: 254, id: "raja", excluded: false }, // Raja Yoga
  { row: 255, id: "raja", excluded: false }, // Raja Yoga
  { row: 256, id: "raja", excluded: false }, // Raja Yoga
  { row: 257, id: "raja", excluded: false }, // Raja Yoga
  { row: 258, id: "raja", excluded: false }, // Raja Yoga
  { row: 259, id: "raja", excluded: false }, // Raja Yoga
  { row: 260, id: "raja", excluded: false }, // Raja Yoga
  { row: 261, id: "raja", excluded: false }, // Raja Yoga
  { row: 262, id: "raja", excluded: false }, // Raja Yoga
  { row: 263, id: "raja", excluded: false }, // Raja Yoga
  { row: 264, id: "galakarna", excluded: true }, // Galakarna Yoga
  { row: 265, id: "vrana", excluded: false }, // Vrana Yoga
  { row: 266, id: "sisnavyadhi", excluded: false }, // Sisnavyadhi Yoga
  { row: 267, id: "kalatrashanda", excluded: false }, // Kalatrashanda Yoga
  { row: 268, id: "kushtaroga", excluded: false }, // Kushtaroga Yoga
  { row: 269, id: "kushtaroga", excluded: false }, // Kushtaroga Yoga
  { row: 270, id: "kshayaroga", excluded: true }, // Kshayaroga Yoga
  { row: 271, id: "bandhana", excluded: false }, // Bandhana Yoga
  { row: 272, id: "karascheda", excluded: false }, // Karascheda Yoga
  { row: 273, id: "sirachcheda", excluded: false }, // Sirachcheda Yoga
  { row: 274, id: "durmarana", excluded: true }, // Durmarana Yoga
  { row: 275, id: "yuddhe_marana", excluded: true }, // Yuddhe Marana Yoga
  { row: 276, id: "sanghataka_marana", excluded: false }, // Sanghataka Marana Yoga
  { row: 277, id: "sanghataka_marana", excluded: false }, // Sanghataka Marana Yoga
  { row: 278, id: "peenasaroga", excluded: false }, // Peenasaroga Yoga
  { row: 279, id: "pittaroga", excluded: false }, // Pittaroga Yoga
  { row: 280, id: "vikalangapatni", excluded: false }, // Vikalangapatni Yoga
  { row: 281, id: "putrakalatraheena", excluded: false }, // Putrakalatraheena Yoga
  { row: 282, id: "bharyasahavyabhichara", excluded: false }, // Bharyasahavyabhichara Yoga
  { row: 283, id: "vamsacheda", excluded: false }, // Vamsacheda Yoga
  { row: 284, id: "guhyaroga", excluded: false }, // Guhyaroga Yoga
  { row: 285, id: "angaheena", excluded: false }, // Angaheena Yoga
  { row: 286, id: "swetakushta", excluded: false }, // Swetakushta Yoga
  { row: 287, id: "pisacha_grastha", excluded: false }, // Pisacha Grastha Yoga
  { row: 288, id: "andha_288", excluded: false }, // Andha Yoga
  { row: 289, id: "andha_288", excluded: false }, // Andha Yoga
  { row: 290, id: "vatharoga", excluded: false }, // Vatharoga Yoga
  { row: 291, id: "matibhramana", excluded: false }, // Matibhramana Yoga
  { row: 292, id: "matibhramana", excluded: false }, // Matibhramana Yoga
  { row: 293, id: "matibhramana", excluded: false }, // Matibhramana Yoga
  { row: 294, id: "matibhramana", excluded: false }, // Matibhramana Yoga
  { row: 295, id: "khalwata", excluded: false }, // Khalwata Yoga
  { row: 296, id: "nishturabhashi", excluded: false }, // Nishturabhashi Yoga
  { row: 297, id: "rajabhrashta", excluded: false }, // Rajabhrashta Yoga
  { row: 298, id: "raja_negative", excluded: false }, // Raja Yoga
  { row: 299, id: "raja_negative", excluded: false }, // Raja Yoga
  { row: 300, id: "gohanta", excluded: false }, // Gohanta Yoga
];
