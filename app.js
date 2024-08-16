var express = require("express");
var app = express();
const { startOfMonth, addDays, eachDayOfInterval, getDay } = require('date-fns');
var mysql = require("mysql");
var cors = require("cors");
const multer = require('multer');
var bodyParser = require("body-parser");
const path = require("path");
const dotenv = require('dotenv');
// Charger les variables d'environnement depuis le fichier .env
dotenv.config();
app.use(cors());
app.use(bodyParser.json());


// CONNEXION AU BASE DE DONNEES 1
var db = mysql.createConnection({
    host:process.env.HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME
});

// CONNEXION AU BASE DE DONNEES 1

db.connect(function(err){
    if(err)
    {
        console.log("Echec de connection au base de données1");
    }
    else
    {
        console.log("Connection au base de données avec succès!\n");
        }
});


                                    // LISITRA ANARANA MPIARA-MANOMPO

app.get("/listaMpiaramanompo",(req,res)=>{
    var req = "select *from mpiaramanompo";
    db.query(req,(err,resultat)=>{
        if(err) throw err;
        else{
            
            res.send(resultat);
        
        }
    });
})


                                    // MANDAHATRA NY LISITRA EO @ TABILAO io

app.get("/listaAnjaraFampirantiana",(req,res)=>{
    var req = "select daty,ora,anarana1,anarana2 from anjara order by daty asc,idAnjara asc";
    db.query(req,(err,resultat)=>{
        if(err) throw err;
        else{
            
            res.send(resultat);
        
        }
    });
})


                                    // LISITRA ORA

app.get("/listaOraHanompoana",(req,res)=>{
    var req = "select OraFampiratiana from Ora";
    db.query(req,(err,resultat)=>{
        if(err) throw err;
        else{
            
            res.send(resultat);
        
        }
    });
})






// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Endpoint to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.send({ filePath: `/uploads/${req.file.filename}` });
});



// Route pour ajouter les dates d'une semaine
app.post('/add-week-dates', (req, res) => {
    const { year, month, weekNumber } = req.body;

    const startDate = getStartDateOfWeek(year, month, weekNumber);
    const weekDates = generateWeekDates(startDate);

    const query = 'INSERT INTO week_dates (date) VALUES ?';
    const values = weekDates.map(date => [date]);

    db.query(query, [values], (err, result) => {
        if (err) throw err;
        res.send('Dates added');
    });
});

function getStartDateOfWeek(year, month, weekNumber) {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const startDay = (weekNumber - 1) * 7 - firstDayOfWeek + 1;
    return new Date(year, month - 1, startDay);
}

function generateWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// Route pour obtenir les dates d'une semaine spécifique
app.get('/week-dates/:year/:month/:weekNumber', (req, res) => {
    const { year, month, weekNumber } = req.params;

    const startDate = getStartDateOfWeek(year, month, weekNumber);
    const weekDates = generateWeekDates(startDate);

    res.json(weekDates);
});







// Fonction pour obtenir les dates de la première semaine du mois
function getFirstWeekDates(year, month) {
    const start = startOfMonth(new Date(year, month - 1));
    const startDayOfWeek = getDay(start);
  
    // Trouver le premier lundi du mois
    const firstMonday = startDayOfWeek === 1 ? start : addDays(start, (8 - startDayOfWeek) % 7);
  
    // Obtenir les dates de la première semaine à partir du premier lundi
    const firstWeekDates = eachDayOfInterval({
      start: firstMonday,
      end: addDays(firstMonday, 6)
    });
  
    return firstWeekDates;
  }
  
  app.get('/first-week/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const dates = getFirstWeekDates(parseInt(year), parseInt(month));
    res.json(dates.map(date => date.toISOString().split('T')[0]));
  });
  



                                    // HAMPIDITRA ANJARA FAMPIRANTIANA VERSION FARANY


app.post("/HampiditraAnjaraFampiratiana", (req, res) => {
    const data = req.body;

    // Étape 1: Identifier le dimanche de la semaine la plus ancienne
    db.query(`
        SELECT DATE_SUB(daty, INTERVAL WEEKDAY(daty) DAY) AS oldestSunday
        FROM anjara
        GROUP BY WEEK(daty)
        ORDER BY oldestSunday ASC
        LIMIT 1
    `, (error, results, fields) => {
        if (error) {
            console.error("Erreur lors de la récupération du dimanche de la semaine la plus ancienne:", error);
            return res.status(500).send({ error: 'Erreur lors de la récupération des données de la base de données' });
        }

        const oldestSunday = results[0]?.oldestSunday;

        if (oldestSunday !== null && oldestSunday !== undefined) {
            // Étape 2: Supprimer les données de la semaine la plus ancienne
            db.query('DELETE FROM anjara WHERE DATE_SUB(daty, INTERVAL WEEKDAY(daty) DAY) = ?', [oldestSunday], (error, results, fields) => {
                if (error) {
                    console.error("Erreur lors de la suppression de la semaine la plus ancienne:", error);
                    return res.status(500).send({ error: 'Erreur lors de la suppression des données dans la base de données' });
                }

                console.log(`Suppression réussie des données de la semaine se terminant le ${oldestSunday}`);

                // Étape 3: Ajouter les nouvelles données
                data.forEach(entry => {
                    const { daty, ora, anarana1, anarana2 } = entry;
                    db.query('INSERT INTO anjara (daty, ora, anarana1, anarana2) VALUES (?, ?, ?, ?)', [daty, ora, anarana1, anarana2], (error, results, fields) => {
                        if (error) {
                            console.error("Erreur lors de l'insertion:", error);
                            return res.status(500).send({ error: 'Erreur lors de l\'insertion dans la base de données' });
                        }
                        console.log(`Insertion réussie pour ${anarana1} et ${anarana2} à ${daty} ${ora}`);
                    });
                });

                res.status(200).send({ message: 'Toutes les données ont été insérées avec succès' });
            });
        } else {
            // Si aucune semaine n'est trouvée, ajoutez simplement les nouvelles données
            data.forEach(entry => {
                const { daty, ora, anarana1, anarana2 } = entry;
                db.query('INSERT INTO anjara (daty, ora, anarana1, anarana2) VALUES (?, ?, ?, ?)', [daty, ora, anarana1, anarana2], (error, results, fields) => {
                    if (error) {
                        console.error("Erreur lors de l'insertion:", error);
                        return res.status(500).send({ error: 'Erreur lors de l\'insertion dans la base de données' });
                    }
                    console.log(`Insertion réussie pour ${anarana1} et ${anarana2} à ${daty} ${ora}`);
                });
            });

            res.status(200).send({ message: 'Toutes les données ont été insérées avec succès' });
        }
    });
});


// HANAVAO NY ANJARA FAMPIRANTIANA 

app.put("/fanovana/:daty/:ora",(req,res)=>{
    const{daty,ora}=req.params;
    const{anarana1,anarana2}=req.body;
    const requeteEditer="update anjara set anarana1=?,anarana2=? where daty=? and ora=?"
    db.query(requeteEditer,[anarana1,anarana2,daty,ora],(error,result)=>{
        if(error){
            console.log(error);
        }else{
            res.send(result);
            console.log("Modification avec succès!");
        }
    });
});


// HAKA AN'IREO ANJARA HO HAVAOZINA
app.get("/Fanavaozana/:Daty/:Ora",(req,res)=>{
    const{Daty,Ora} = req.params;
    var requeteIdOvana = "SELECT *FROM anjara where daty=? and ora=?";
    db.query(requeteIdOvana,[Daty,Ora],(err,resultat)=>{
        if(err) throw err;
        else{
            res.send(resultat);                
        }
    });
    
});


// HIJERY DATY AMIN'IZAO
app.get("/Daty",(req,res)=>{
    var requeteIdOvana = "SELECT curdate() as Daty";
    db.query(requeteIdOvana,(err,resultat)=>{
        if(err) throw err;
        else{
            res.send(resultat);                
        }
    });
    
});


// HAKA MPIARAMANOMPO
app.get("/LisitraMpiaraManompo",(req,res)=>{
    var requete = "select *from mpiaramanompo";
    db.query(requete,(err,resultat)=>{
        if(err) throw err;
        else{
            res.send(resultat);                
        }
    });
    
});


// HAMPIDITRA

app.post("/fampidirana",(req,res)=>{
    const{Anarana}=req.body;
    var requete = "insert into mpiaramanompo(anarana) values(?)";
    db.query(requete,[Anarana],(err,resultat)=>{
        if(err) throw err;
        else{
            res.send(resultat);                
        }
    });
    
});

// HAKA AN'IREO ANJARA HO HAVAOZINA
app.get("/MakaId/:idMpiaramanompo",(req,res)=>{
    const{idMpiaramanompo} = req.params;
    var requeteAnarana = "SELECT *FROM mpiaramanompo where idMpiaramanompo=?";
    db.query(requeteAnarana,[idMpiaramanompo],(err,resultat)=>{
        if(err) throw err;
        else{
            res.send(resultat);                
        }
    });
    
});


// HANAVAO NY ANARANA MPIARA-MANOMPO 

app.put("/fanovanaAnarana/:id",(req,res)=>{
    const{id}=req.params;
    const{AnaranaVaovao}=req.body;
    const requeteFanavaozana="update mpiaramanompo set anarana=? where idMpiaramanompo=?"
    db.query(requeteFanavaozana,[AnaranaVaovao,id],(error,result)=>{
        if(error){
            console.log(error);
        }else{
            res.send(result);
            console.log("Modification avec succès!");
        }
    });
});


// HAMAFA ANARANA

app.delete("/fafanaAnarana/:idFafana",(req,res)=>{
    const{idFafana}=req.params;
    const requeteFamafana="delete from mpiaramanompo where idMpiaramanompo=?"
    db.query(requeteFamafana,[idFafana],(error,result)=>{
        if(error){
            console.log(error);
        }else{
            res.send(result);
            console.log("Suppression avec succès!");
        }
    });
});




                                            // AJOUT AVEC SUPPRESSION SANS DIMANCHE


// app.post("/HampiditraAnjaraFampiratiana", (req, res) => {
//     Le tableau d'objets envoyé depuis le frontend
//     const data = req.body;

//     Étape 1: Identifier la semaine la plus ancienne
//     db.query('SELECT MIN(WEEK(daty)) AS oldestWeek FROM anjara', (error, results, fields) => {
//         if (error) {
//             console.error("Erreur lors de la récupération de la semaine la plus ancienne:", error);
//             return res.status(500).send({ error: 'Erreur lors de la récupération des données de la base de données' });
//         }

//         const oldestWeek = results[0].oldestWeek;

//         if (oldestWeek !== null) {
//             Étape 2: Supprimer les données de la semaine la plus ancienne
//             db.query('DELETE FROM anjara WHERE WEEK(daty) = ?', [oldestWeek], (error, results, fields) => {
//                 if (error) {
//                     console.error("Erreur lors de la suppression de la semaine la plus ancienne:", error);
//                     return res.status(500).send({ error: 'Erreur lors de la suppression des données dans la base de données' });
//                 }

//                 console.log(`Suppression réussie des données de la semaine ${oldestWeek}`);

//                 Étape 3: Ajouter les nouvelles données
//                 data.forEach(entry => {
//                     const { daty, ora, anarana1, anarana2 } = entry;
//                     db.query('INSERT INTO anjara (daty, ora, anarana1, anarana2) VALUES (?, ?, ?, ?)', [daty, ora, anarana1, anarana2], (error, results, fields) => {
//                         if (error) {
//                             console.error("Erreur lors de l'insertion:", error);
//                             return res.status(500).send({ error: 'Erreur lors de l\'insertion dans la base de données' });
//                         }
//                         console.log(`Insertion réussie pour ${anarana1} et ${anarana2} à ${daty} ${ora}`);
//                     });
//                 });

//                 Réponse au client après avoir traité toutes les insertions
//                 res.status(200).send({ message: 'Toutes les données ont été insérées avec succès' });
//             });
//         } else {
//             Si aucune semaine n'est trouvée, ajoutez simplement les nouvelles données
//             data.forEach(entry => {
//                 const { daty, ora, anarana1, anarana2 } = entry;
//                 db.query('INSERT INTO anjara (daty, ora, anarana1, anarana2) VALUES (?, ?, ?, ?)', [daty, ora, anarana1, anarana2], (error, results, fields) => {
//                     if (error) {
//                         console.error("Erreur lors de l'insertion:", error);
//                         return res.status(500).send({ error: 'Erreur lors de l\'insertion dans la base de données' });
//                     }
//                     console.log(`Insertion réussie pour ${anarana1} et ${anarana2} à ${daty} ${ora}`);
//                 });
//             });

//             Réponse au client après avoir traité toutes les insertions
//             res.status(200).send({ message: 'Toutes les données ont été insérées avec succès' });
//         }
//     });
// });





                                    // ORIGINAL VERSION ANJARA FAMPIRANTIANA


// app.post("/HampiditraAnjaraFampiratiana", (req, res) => {
//     Le tableau d'objets envoyé depuis le frontend
//     const data = req.body; 

    
//     Parcourir chaque objet et insérer dans la base de données
//     data.forEach(entry => {
//         const { daty, ora, anarana1,anarana2 } = entry;
//         db.query('INSERT INTO anjara (daty, ora, anarana1,anarana2) VALUES (?, ?, ?, ?)', [daty, ora, anarana1,anarana2], (error, results, fields) => {
//             if (error) {
//                 console.error("Erreur lors de l'insertion:", error);
//                 return res.status(500).send({ error: 'Erreur lors de l\'insertion dans la base de données' });
//             }
//             console.log(`Insertion réussie pour ${anarana1} et ${anarana2}  à ${daty} ${ora}`);
//         });
//     });

//     Réponse au client après avoir traité toutes les insertions
//     res.status(200).send({ message: 'Toutes les données ont été insérées avec succès' });
// });




// Fonction pour générer toutes les dates jusqu'à la fin du mois
function generateDates(startDate) {
    const dates = [];
    let currentDate = new Date(startDate);
  
    while (currentDate.getMonth() === startDate.getMonth()) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return dates;
  }

  function getRandomDate(startDate, endDate) {
    // Calculer la différence entre les deux dates en millisecondes
    const difference = endDate.getTime() - startDate.getTime();
    // Générer un nombre aléatoire entre 0 et la différence
    const randomDifference = Math.random() * difference;
    // Ajouter ce nombre aléatoire à la date de départ
    const randomDate = new Date(startDate.getTime() + randomDifference);
    return randomDate;
}


                            // HAMAFA ANJARA

// app.delete("/HamafaAnjara",(req,res)=>{

//     const hamafa="DELETE FROM anjara";
//     db.query(hamafa,(error,result)=>{
//         if(error){
//             console.log(error);
//         }
//         res.send(result);
//     });
    
// });


       


                                // AFFICHE DATE ET HEURE AUJOURDH'HUI

        // app.get("/AfficheDateHeure",(req,res)=>{
        //     var requeteAfficheDateHeure = "SELECT now() as dateHeure";
        //     db.query(requeteAfficheDateHeure,(err,resultat)=>{
        //         if(err) throw err;
        //         res.send(resultat);
        //     });
            
        // });




                                        // MODIFICATION DE DECLARATION

// app.put("/EditerDeclaration/:id",(req,res)=>{
//     const{id}=req.params;
//     const{NIF,DateDeclaration,DateTransaction,BaseImposable,idType,NomCom,Taux,Nature,Detail,Activite,MontantDu,Statut,DateFinPaiement,Periode,Annee}=req.body;
//     const requeteEditer="UPDATE declaration SET NIF=?,DateDeclaration=?,DateTransaction=?,BaseImposable=?,idType=?,NomCom=?,Taux=?,Nature=?,Detail=?,Activite=?,MontantDu=?,Statut=?,DateFinPaiement=?,Periode=?,Annee=? Where idDeclaration=?";
//     db.query(requeteEditer,[NIF,DateDeclaration,DateTransaction,BaseImposable,idType,NomCom,Taux,Nature,Detail,Activite,MontantDu,Statut,DateFinPaiement,Periode,Annee,id],(error,result)=>{
//         if(error){
//             console.log(error);
//         }else{
//             res.send(result);
//         }
//     });
// });




     
    
// app.listen(port,function(){
//     console.log("Le serveur fonctionne sur le port "+port+":"+" http://127.0.0.1:"+port);
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;