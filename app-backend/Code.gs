const TIME_ZONE_STRING = Session.getScriptTimeZone(); // default set 'America/Lima'
const SHEET_DATABASE = "database";
const KEY_COLUMN_EMAIL = "email";
const KEY_COLUMN_GOOGLE_SHEET_URL = "google_sheet_url"; 


function getCurrentDateFormated() {
  return Utilities.formatDate(new Date(), TIME_ZONE_STRING, 'yyyy-MM-dd HH:mm:ss');
}

function getSheetByName(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(sheetName);
  return sheet;
}

function doGet(event = {}) {
  let result = readParamGet(event);
  return returnJSON(result);
}

function readParamGet(e) {
  const { parameter } = e;
  const { op: operation } = parameter; // Desestructuración (útil para eliminar validación específica)
  let result = [];

  if (operation === 'test') {
    result = "hello world testing"

  // Mejorar este proceso GET "registrar en googleSheet"
  } else if (operation === 'listenersms' && 'mensaje' in e.parameter && 'urlgooglesheet' in e.parameter ) { // yape
    const message = e.parameter.mensaje;
    const urlgooglesheet = e.parameter.urlgooglesheet
    result = addYapeRecords(urlgooglesheet, message);
  }

  return result;
}

function testaddYapeRecords() {
  addYapeRecords(
    "https://docs.google.com/spreadsheets/d/1H0DWLFxuMEdaxwJ4N6f1Hd69LRQMdUfyOmUh5cFuPfY/edit?usp=drivesdk",
    "Victor A. Copitan N. te envió un pago por S/ 0.1. El cód. de seguridad es: 541"
  )
}

function addYapeRecords(urlgooglesheet, message=""){
  let URL = urlgooglesheet;
  let respuesta = "";
  //var mensaje_yape = 'Yape! PEPE LUCHO RIOS SOLIS te envió un pago por S/ 22';
  var mensaje_yape = message;
  var jo = {};

  Logger.log("start to = " + Utilities.formatDate(new Date(), TIME_ZONE_STRING, 'yyyy-MM-dd HH:mm:ss.S'));
  Logger.log("Llego request con mensaje = " + message);
  
  var lock = LockService.getScriptLock();
  // Si el script no está bloqueado, lo bloquea y avanza a la siguiente línea.
  // Caso contrario, espera hasta que se desbloquee o se agote el tiempo indicado (5 seg)
  lock.tryLock(5000);
  if (lock.hasLock() === true) {
    if (
      mensaje_yape.includes("Yape") === true ||
      mensaje_yape.includes("te envió un pago por") === true
    ) {
      jo.status = '0';
      jo.message = "Se registro el listener";
      var persona = mensaje_yape.split("te")[0].trim().replace("Yape! ", "");
      var monto_array = mensaje_yape.split(" ");
      var monto = monto_array[monto_array.length - 1];

      var sheet = SpreadsheetApp.openByUrl(URL);
      sheet = sheet.getActiveSheet(); // BUG = https://stackoverflow.com/questions/57633283/sheet-getrange-throwing-signature-mismatch-exception-when-not-using-a1-notation

      const dateFormated = Utilities.formatDate(new Date(), TIME_ZONE_STRING, 'yyyy-MM-dd HH:mm:ss');
      // Validation multiple request GET del apk
      var registrar = true;
      try {
        var p_row, p_column, p_numRows, p_numColumns;
        p_row = 2;                            // The starting row index of the range; row indexing starts with 1.
        p_column = 1;                         // The starting column index of the range; column indexing starts with 1.
        p_numRows = sheet.getLastRow() - 1;   // The number of rows to return.
        p_numColumns = sheet.getLastColumn(); // The number of columns to return.

        var rows = sheet.getRange(p_row, p_column, p_numRows, p_numColumns).getValues();
        var lastRow = rows.length - 1;
        lastRow = (lastRow <= 0) ? 1 : lastRow; // lastRow

        // Bloqueo de 30 segundos. Existe 1 error en la APK registra varias veces el yapeo en menos de 5 segundos
        var bloqueoEnSegundos = 30;
        console.log("lastRow ", lastRow)
        console.log("mensaje_yape anterior ", rows[lastRow][1])
        console.log("mensaje_yape ", mensaje_yape)
        if (
          rows[lastRow][1] == mensaje_yape && 
          (new Date().getTime() - rows[lastRow][0].getTime()) < (bloqueoEnSegundos * 1000)
        ) {
          registrar = false;
        }
      } catch (err) {
        console.log('Failed with an error %s', err.message);
      }

      if (registrar === true) {
        sheet.appendRow([dateFormated, mensaje_yape]);
      }

      Logger.log("Se Registro una nueva fila YAPE message= " + mensaje_yape);
      Logger.log("en urlsheet= " + URL);
    } else {
      jo.status = '1';
      jo.message = "no es mensaje valido";
      Logger.log("No se Registro una nueva fila YAPE");
    }
    // respuesta = JSON.stringify(jo);
    respuesta = jo;
    return respuesta;
  }
  
  // desbloquea el script
  lock.releaseLock();
}

/**
 * Read GET REQUEST 
 * 
 * @return json
**/
function returnJSON(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(request = {}) {
  let result = readParamPOST(request);
  return returnJSON(result);
}
/**
 * Read Parameter by POST
 * 
 * @param object $e
 * 
 * @return array
**/
function readParamPOST(request = {}) {
  let result = [];
  const { parameter, postData: { contents, type } = {} } = request;
  Logger.log("readParamPOST: request");
  Logger.log(request);
  console.log("readParamPOST: request")
  console.log(request)

  if (type === 'application/json') {
    const jsonData = JSON.parse(contents);
    if (jsonData.op === "login") {
      result = login(jsonData)
    } else if (jsonData.op === "register") {
      result = registerNewUser(jsonData)
    }
  }

  return result;
}

/**
 * Login User
 */
function login(jsonData) {
  var processingStatus = { status: "error", message: "", data: null };
  let { email, password } = jsonData;
  if (!email || !password) {
    processingStatus.status = "error";
    processingStatus.message = "Correo, o clave deben ser completados";
    
    return processingStatus;
  }

  // Perform an action if the status is "ok"

  // Corrigiendo bug de email q se escriben en Mayuscula o Capitalize
  email = email.toLocaleLowerCase().trim();

  console.log("email", email, "password", password);
  let rsResult = searchUserAndGetColumns(email, password);
  console.log("rsResult", rsResult);

  //if (typeof rsResult === "object" && rsResult !== null) {
  if (rsResult === null) {
    processingStatus.status = 'error';
    processingStatus.message = "Usuario/contraseña incorrectos";

    return processingStatus;
  } else if (typeof rsResult === "object" && rsResult !== null) {
    processingStatus.status = 'ok';
    processingStatus.message = "Tu cuenta ha iniciado sesión";
    processingStatus.data = rsResult;

    return processingStatus;
  }

  return processingStatus;
}

function testLogin(){

  let email= "android@pprios.com";
  let password= "android";
  let result = login( { "email": email, "password": password } );

  Logger.log("email %s", email);
  Logger.log("password %s", password);
  Logger.log("result");
  Logger.log(result);
  console.log("result", result);
}

/**
 * Register a new User
 * - validation of email
 * - creation of id token of the user: useful to send message by GET messages
 */
function registerNewUser(jsonData) {
  var processingStatus = { status: "error", message: "", data: null };

  // validation
  let { name, email, password } = jsonData;
  name = name.toLowerCase().trim();
  email = email.toLowerCase().trim();

  if (!name || !email || !password) {
    processingStatus.status = "error";
    processingStatus.message = "Nombre, Correo, o clave deben ser completados";

    return processingStatus;
  } else if (searchByEmail(email) == true) {
    processingStatus.status = "error";
    processingStatus.message = "El correo ya se encuentra registrado";

    return processingStatus;
  }

  let rsResult = createNewUser(name, email, password);
  if (typeof rsResult === "object" && rsResult !== null) {
    processingStatus.status = "ok";
    processingStatus.message = "¡Listo! Tu cuenta ha sido creada exitosamente.";
    processingStatus.data = rsResult

    return processingStatus;
  }

  return processingStatus;
}

function testRegisterNewUser() {
  let jsonData = {
      "op": "register",
      "name": "pepe1 rios",
      "email": "pepe1@pprios.com",
      "password": "clave123"
  }
  let rs = registerNewUser(jsonData);
  
  console.log(rs);
}

/**
 * Create new users
 * @return object data
 */
function createNewUser(name, email, password){
  let id = generateUniqueID();
  let createdAt = getCurrentDateFormated();
  let subscriptionStartDate = Utilities.formatDate(new Date(), TIME_ZONE_STRING, 'yyyy-MM-dd');
  let subscriptionDurationDays = 3; // 3 days of suscription by default
  let subscriptionPlan = 1;
  let googleSheetUrl = createSpreadsheetAndShare(id); // ""
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(5000); // Espera un máximo de 5 segundos para obtener el bloqueo
    
    var sheet = getSheetByName(SHEET_DATABASE);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1).setValue(id);
    sheet.getRange(lastRow + 1, 2).setValue(email);
    sheet.getRange(lastRow + 1, 3).setValue(password);
    sheet.getRange(lastRow + 1, 4).setValue(name);
    sheet.getRange(lastRow + 1, 5).setValue(createdAt);
    // sheet.getRange(lastRow + 1, 6).setValue(updateAt);
    sheet.getRange(lastRow + 1, 7).setValue(subscriptionStartDate);
    sheet.getRange(lastRow + 1, 8).setValue(subscriptionDurationDays);
    sheet.getRange(lastRow + 1, 9).setValue(subscriptionPlan);
    sheet.getRange(lastRow + 1, 10).setValue(googleSheetUrl);
    // ALTERNATIVE ...
    // sheet.appendRow([id, email, password, name, createdAt]);
  } catch (e) {
    Logger.log("Error al registrar información nuevo usuario: " + e);
    Logger.log("Usuario id=%s", id);
  } finally {
    lock.releaseLock(); // Libera el bloqueo sin importar si hubo un error o no
  }

  const reconstructedResult = {
    id, email, name, createdAt, subscriptionStartDate,
    subscriptionDurationDays, subscriptionPlan, googleSheetUrl
  };

  return reconstructedResult;
}

/**
 * Create Spreadsheet
 * @return string URL (if is successfull)
 */
function createSpreadsheetAndShare(theID="testfile15") {
  var viewerLink = "";
  const OKEY_PAY_DIRECTORY = "okeyPayApp"
  const OKEY_PAY_SHEET_DIRECTORY = "sheets"

  try {
    // Buscar la carpeta "okeyPayData" en la raíz de Google Drive
    var folders = DriveApp.getFoldersByName(OKEY_PAY_DIRECTORY);
    var okeyPayFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(OKEY_PAY_DIRECTORY);

    // Buscar la subcarpeta "sheets" dentro de la carpeta "okeyPay"
    var sheetsFolders = okeyPayFolder.getFoldersByName(OKEY_PAY_SHEET_DIRECTORY);
    var sheetsFolder = sheetsFolders.hasNext() ? sheetsFolders.next() : okeyPayFolder.createFolder(OKEY_PAY_SHEET_DIRECTORY);

    // Crear una hoja de cálculo dentro de la subcarpeta "sheets"
    var spreadsheet = SpreadsheetApp.create(theID);
    Logger.log("Hoja de calculo fue creado con id= %s y la URL= %s", theID, spreadsheet.getUrl());
    
    var fileID = spreadsheet.getId();
    var file = DriveApp.getFileById(fileID)
    var folder = DriveApp.getFolderById(sheetsFolder.getId())
    // var newFile = file.makeCopy(folder);
    file.moveTo(folder);
    //Remove file from root folder--------------------------------//
    // DriveApp.getFileById(fileID).setTrashed(true)
    

    // Hacer que la hoja de cálculo sea pública para ver
    var fileId = spreadsheet.getId();
    var file = DriveApp.getFileById(fileId);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Obtener la URL de compartir para ver
    viewerLink = file.getUrl();
    
    // Crear una nueva hoja en la hoja de cálculo
    var sheet = spreadsheet.getSheets()[0];
    
    // Definir los encabezados y anchos
    sheet.getRange("A1").setValue("Fecha");
    sheet.setColumnWidth(1, 140); 
    sheet.getRange("B1").setValue("Mensaje");
    sheet.setColumnWidth(2, 500);

    Logger.log("URL de visualización publica todos: " + viewerLink);
  } catch (e) {
    Logger.log("Error en el proceso de creacion de la hoja de calculo " + e);
  }

  return viewerLink
}

/**
 * Guaranteed unique ID
 */
function generateUniqueID() {
  // Get current timestamp in milliseconds
  var timestamp = new Date().getTime();

  // Generate a random number between 0 and 9999
  var random = Math.floor(Math.random() * 10000);

  // Combine timestamp and random number to create a unique ID
  var uniqueID = timestamp + "-" + random;

  return uniqueID;
}

function testsearchByEmail(){
  searchByEmail()
}
/**
 * search email
 * 
 * @return boolean
 */
function searchByEmail(emailToSearch="pepe1@pprios.com") {
  var sheet = getSheetByName(SHEET_DATABASE);
  
  // Asumiendo que la primera fila contiene encabezados, ajusta el índice según sea necesario
  var emailColumnIndex = sheet.getDataRange().getValues()[0].indexOf('email') + 1;

  //console.log("sheet.getDataRange().getValues()", sheet.getDataRange().getValues());
  //console.log("sheet.getDataRange().getValues()", sheet.getDataRange().getValues()[0].indexOf('email'));
  //console.log("emailColumnIndex", emailColumnIndex);
  //console.log("sheet.getLastRow() - 1", sheet.getLastRow() - 1);

  var lastRow = (sheet.getLastRow() - 1 <= 0) ? 1 : sheet.getLastRow() - 1; // Bug el valor '0' no se admite minimo valor 1 (sucede cuando no hay registros)
  //console.log("lastRow", lastRow);
  var textFinder = sheet.getRange(2, emailColumnIndex, lastRow).createTextFinder(emailToSearch);
  var occurrences = textFinder.findAll();
  
  if (occurrences.length > 0) {
    console.log("correo existe", emailToSearch);
    return true;
  } else {
    console.log("correo no existe", emailToSearch);
    return false;
  }
}

/**
 * Find user data by email & password
 *
 * @return object|null
 */
function searchUserAndGetColumns(usernameToFind, passwordToFind) {
  var sheet = getSheetByName(SHEET_DATABASE);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) { // Empezamos desde 1 para omitir la fila de encabezados
    
    var fila = data[i];
    var username = fila[1].toString(); // Columna de usuario
    var password = fila[2].toString(); // Columna de contraseña

    if (username === usernameToFind && password === passwordToFind) {
      var filaReturn = {
        "id":                         fila[0],
        "email":                      fila[1],
        "name":                       fila[3],
        "createdAt":                  fila[4],
        // "updateAt":                   fila[5],
        "subscriptionStartDate":      fila[6],
        "subscriptionDurationDays":   fila[7],
        "subscriptionPlan":           fila[8],
        "googleSheetUrl":             fila[9],
      };
      return filaReturn; // Retornar la fila completa
      // return fila; // Retornar la fila completa
    }
  }

  return null; // Si no se encuentra el usuario y contraseña
}

function textIsURL(){
  console.log(isURL("xxx"))
}

/**
 * Validation of URL
 *
 * @return Boolean
 */
function isURL(input) {
  // Regular expression to match URLs
  var urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  
  return urlPattern.test(input);
}

/**
 * Clear SpreadSheet remove all context every day to 3AM
 *
 * @return void (trigerr execution)
 */
function cleanAllSpreadSheets() {
  var mainSheet = getSheetByName(SHEET_DATABASE);
  var mainData = mainSheet.getDataRange().getValues();

  for (var i = 1; i < mainData.length; i++) {
    var fila = mainData[i];
    const URL = fila[9].toString(); // urlGoogleSheet
    if (isURL(URL) === true) {
      Logger.log("clean SpreadSheet URL= " + URL);
      var sheet = SpreadsheetApp.openByUrl(URL);
      sheet = sheet.getActiveSheet();

      var lastRow = (sheet.getLastRow() - 1 <= 0) ? 1 : sheet.getLastRow() - 1; // Bug el valor '0' no se admite minimo valor 1 (sucede cuando no hay registros)
      var range = sheet.getRange(2, 1, lastRow, sheet.getLastColumn());
      range.clearContent(); // Borra el contenido de todas las filas excepto la primera
    }
  }
}

