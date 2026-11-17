/** Nexus Chat: preparación del servicio de contactos. Publicar como usuario que accede. */
var NEXUS_CONTACTS_PROTOCOL_ = 'nexus-contacts-preview-v1';
var NEXUS_FIELDS_ = 'names,metadata,clientData,userDefined';
var NEXUS_LINK_ = 'nexusChat.contact.v1';
var NEXUS_NUMBER_ = 'Nexus Chat · número';
var NEXUS_USERNAME_ = 'Nexus Chat · usuario';

// Abrir /exec solo comprueba acceso. Nunca escribe ni devuelve la agenda.
function doGet(event) {
  if (event && event.parameter && event.parameter.mode === 'connect') return nexusConnect_(event.parameter);
  try {
    nexusAccount_();
  } catch (error) {
    var code = error && error.message;
    var messages = {
      NEXUS_EMAIL_PERMISSION: 'Autoriza el permiso de correo de la cuenta. Revisa userinfo.email en appsscript.json.',
      NEXUS_EMAIL_UNAVAILABLE: 'Google no devolvió el correo. Comprueba el permiso de correo y Ejecutar como: usuario que accede.',
      NEXUS_ACCOUNT_MISMATCH: 'La cuenta activa no coincide con la que ejecuta el script. Configura Ejecutar como: usuario que accede.'
    };
    var known = Object.prototype.hasOwnProperty.call(messages, code);
    return nexusJSON_({ok: false, protocolo: NEXUS_CONTACTS_PROTOCOL_, revision: 4, paso: 'cuenta', codigo: known ? code : 'ACCOUNT_CHECK_FAILED', mensaje: known ? messages[code] : 'No se pudo comprobar la cuenta. Revisa la autorización y la configuración de ejecución.'});
  }
  if (typeof People === 'undefined') {
    return nexusJSON_({ok: false, protocolo: NEXUS_CONTACTS_PROTOCOL_, revision: 4, paso: 'contactos', codigo: 'PEOPLE_SERVICE_MISSING', mensaje: 'Añade People API v1 en Servicios del proyecto de Apps Script.'});
  }
  try {
    People.People.Connections.list('people/me', {pageSize: 1, personFields: 'names'});
    return nexusJSON_({ok: true, protocolo: NEXUS_CONTACTS_PROTOCOL_, revision: 4, mensaje: 'Conexión con los contactos de Google correcta.'});
  } catch (error) {
    return nexusJSON_({ok: false, protocolo: NEXUS_CONTACTS_PROTOCOL_, revision: 4, paso: 'contactos', codigo: 'CONTACTS_ACCESS_FAILED', mensaje: 'No se pudo leer la agenda. Comprueba People API habilitada y el permiso de contactos concedido.'});
  }
}

// Preparado para un envío POST por formulario desde Nexus, sin tokens en URLs.
// Este POST muestra una vista previa: la escritura requiere pulsar Guardar.
function doPost(event) {
  try {
    var bridge = event && event.parameter && event.parameter.state ? nexusReturnContext_(event.parameter) : null;
    var account = nexusAccount_();
    var raw = event && event.parameter && event.parameter.contact;
    if (typeof raw !== 'string' || raw.length > 4096) throw new Error('CONTACT');
    var contact = nexusContact_(JSON.parse(raw));
    if (contact.email !== account) throw new Error('ACCOUNT');
    var ticket = Utilities.getUuid();
    CacheService.getUserCache().put('nexus-contact-draft:' + ticket, JSON.stringify(contact), 300);
    if (bridge) CacheService.getUserCache().put('nexus-contact-return:' + ticket, JSON.stringify(bridge), 300);
    return nexusStyledOutput_(nexusPreview_(contact, account, ticket, bridge)).setTitle('Guardar contacto · Nexus Chat');
  } catch (error) {
    var back = bridge ? '<a target="_top" href="' + nexusEscape_(nexusReturnURL_(bridge, {operation: 'save', ok: false})) + '">Volver a Nexus Chat</a>' : '';
    return nexusStyledOutput_('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"></head><body><p>No se pudo preparar el contacto. Comprueba tu cuenta de Google y vuelve a Nexus Chat.</p>' + back + '</body></html>').setTitle('Nexus Chat');
  }
}

// Llamada exclusivamente desde la vista previa de HtmlService con un ticket privado.
function saveNexusContact(ticket) {
  if (typeof ticket !== 'string' || !/^[a-f0-9-]{36}$/i.test(ticket)) throw new Error('La solicitud no es válida.');
  var account = nexusAccount_();
  var lock = LockService.getUserLock();
  if (!lock.tryLock(10000)) throw new Error('Hay otro contacto guardándose. Vuelve a intentarlo.');
  try {
    var raw = CacheService.getUserCache().get('nexus-contact-draft:' + ticket);
    if (!raw) throw new Error('La solicitud caducó. Vuelve a abrir el contacto desde Nexus Chat.');
    var contact = nexusContact_(JSON.parse(raw));
    if (contact.email !== account) throw new Error('Utiliza la cuenta de Google asociada a tu sesión de Nexus Chat.');
    var properties = PropertiesService.getUserProperties();
    var key = 'nexus-contact:' + contact.owner + ':' + contact.uid;
    var receipt = properties.getProperty(key);
    var person = nexusFind_(contact);
    // A lost response must never cause a second create, even after propagation delay.
    if (!person && receipt) throw new Error('Falta confirmar el guardado anterior. Revisa tu agenda y vuelve a intentarlo más tarde.');
    if (person && receipt && receipt !== 'pending' && receipt !== person.resourceName) throw new Error('El vínculo del contacto cambió. Revisa tu agenda antes de continuar.');
    var custom = (person ? person.userDefined || [] : []).filter(function(field) { return field.key !== NEXUS_NUMBER_ && field.key !== NEXUS_USERNAME_; });
    if (contact.phone) custom.push({key: NEXUS_NUMBER_, value: contact.phone});
    if (contact.username) custom.push({key: NEXUS_USERNAME_, value: '@' + contact.username});
    var links = (person ? person.clientData || [] : []).filter(function(field) { return field.key !== NEXUS_LINK_; });
    links.push({key: NEXUS_LINK_, value: JSON.stringify({owner: contact.owner, uid: contact.uid})});
    var body = {names: [{givenName: contact.first, familyName: contact.last}], userDefined: custom, clientData: links};
    var saved;
    if (person) {
      if (!/^people\/[a-zA-Z0-9_-]+$/.test(person.resourceName) || !(person.metadata && person.metadata.sources && person.metadata.sources.some(function(source) { return source.type === 'CONTACT' && source.etag; }))) throw new Error('No se pudo comprobar la versión del contacto.');
      body.etag = person.etag;
      body.metadata = person.metadata;
      saved = People.People.updateContact(body, person.resourceName, {updatePersonFields: 'names,userDefined,clientData', personFields: NEXUS_FIELDS_});
    } else {
      properties.setProperty(key, 'pending');
      saved = People.People.createContact(body, {personFields: NEXUS_FIELDS_});
    }
    if (!saved || !/^people\/[a-zA-Z0-9_-]+$/.test(saved.resourceName)) throw new Error('No se pudo confirmar el contacto guardado.');
    properties.setProperty(key, saved.resourceName);
    var result = {ok: true, creado: !person};
    var returnContext = CacheService.getUserCache().get('nexus-contact-return:' + ticket);
    if (returnContext) result.returnUrl = nexusReturnURL_(nexusReturnContext_(JSON.parse(returnContext)), {operation: 'save', ok: true, email: account, created: !person});
    return result;
  } catch (error) {
    // No raw provider errors, contact content or tokens in browser responses/logs.
    throw new Error('No se pudo confirmar el guardado. Revisa tu agenda antes de volver a intentarlo.');
  } finally {
    lock.releaseLock();
  }
}

function nexusAccount_() {
  var active, effective;
  try {
    active = Session.getActiveUser().getEmail().trim().toLowerCase();
    effective = Session.getEffectiveUser().getEmail().trim().toLowerCase();
  } catch (error) {
    throw new Error('NEXUS_EMAIL_PERMISSION');
  }
  if (!active) throw new Error('NEXUS_EMAIL_UNAVAILABLE');
  if (active !== effective) throw new Error('NEXUS_ACCOUNT_MISMATCH');
  return active;
}

function nexusContact_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('CONTACT');
  var allowed = ['owner', 'uid', 'email', 'first', 'last', 'username', 'phone'];
  if (Object.keys(input).some(function(key) { return allowed.indexOf(key) < 0; })) throw new Error('CONTACT');
  var contact = {};
  allowed.forEach(function(key) {
    if (input[key] !== undefined && typeof input[key] !== 'string') throw new Error('CONTACT');
    contact[key] = (input[key] || '').trim();
    if (/[\u0000-\u001f\u007f]/.test(contact[key])) throw new Error('CONTACT');
  });
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(contact.owner) || !/^[a-zA-Z0-9_-]{1,128}$/.test(contact.uid)) throw new Error('CONTACT');
  contact.email = contact.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || contact.email.length > 254) throw new Error('CONTACT');
  if (!contact.first || contact.first.length > 80 || contact.last.length > 80 || (contact.first + ' ' + contact.last).trim().length > 128) throw new Error('CONTACT');
  contact.username = contact.username.replace(/^@/, '');
  if (contact.username && !/^[a-zA-Z0-9_.]{1,32}$/.test(contact.username)) throw new Error('CONTACT');
  if (contact.phone && !/^\+[1-9]\d{6,14}$/.test(contact.phone)) throw new Error('CONTACT');
  return contact;
}
function nexusFind_(contact) {
  var page = '', seen = {}, found = null, count = 0;
  do {
    var options = {pageSize: 1000, personFields: NEXUS_FIELDS_, sources: ['READ_SOURCE_TYPE_CONTACT']};
    if (page) options.pageToken = page;
    var data = People.People.Connections.list('people/me', options);
    if (!data || (data.connections !== undefined && !Array.isArray(data.connections))) throw new Error('AGENDA');
    (data.connections || []).forEach(function(person) {
      if (person.metadata && person.metadata.deleted) return;
      var linked = (person.clientData || []).some(function(field) {
        if (field.key !== NEXUS_LINK_) return false;
        try { var link = JSON.parse(field.value); return link.owner === contact.owner && link.uid === contact.uid; } catch (error) { return false; }
      });
      if (linked) {
        if (found && found.resourceName !== person.resourceName) throw new Error('DUPLICATES');
        found = person;
      }
    });
    page = data.nextPageToken || '';
    if (typeof page !== 'string' || (page && (seen[page] || ++count > 100))) throw new Error('AGENDA');
    if (page) seen[page] = true;
  } while (page);
  return found;
}
function nexusJSON_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function nexusEscape_(value) { return String(value).replace(/[&<>"']/g, function(char) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]; }); }
function nexusPreview_(contact, account, ticket, bridge) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Guardar contacto · Nexus Chat</title></head><body>' +
    '<h1>Guardar contacto</h1><p>' + nexusEscape_([contact.first, contact.last].filter(Boolean).join(' ')) + '</p><p>Cuenta de destino: ' + nexusEscape_(account) + '</p>' +
    '<button id="save" type="button">Guardar contacto</button><p id="status" role="status"></p><a id="return" target="_top" hidden>Volver a Nexus Chat</a><script>' +
    'var failureReturn=' + JSON.stringify(bridge ? nexusReturnURL_(bridge, {operation: 'save', ok: false}) : '') + ';var button=document.getElementById("save"),statusNode=document.getElementById("status");button.onclick=function(){button.disabled=true;statusNode.textContent="Guardando…";' +
    'google.script.run.withSuccessHandler(function(result){statusNode.textContent="Contacto guardado en tu cuenta de Google. Puedes volver a Nexus Chat.";if(result.returnUrl){var link=document.getElementById("return");link.href=result.returnUrl;link.hidden=false;}})' +
    '.withFailureHandler(function(){statusNode.textContent="No se pudo confirmar el guardado. Revisa tu agenda antes de volver a intentarlo.";button.disabled=false;if(failureReturn){var back=document.getElementById("return");back.href=failureReturn;back.hidden=false;}})' +
    '.saveNexusContact(' + JSON.stringify(ticket) + ');};</script></body></html>';
}


// Only these origins can receive confirmation; never accept an arbitrary return URL.
function nexusReturnContext_(params) {
  if (!params || !/^[a-f0-9-]{36}$/i.test(params.state || '') || params.origin !== 'https://nexus-chat-nc.web.app') throw new Error('RETURN');
  return {state: params.state, origin: params.origin};
}
function nexusReturnURL_(context, result) {
  return context.origin + '/google-contact-return.html#' + encodeURIComponent(JSON.stringify({protocol: 'nexus-contacts-bridge-v1', state: context.state, operation: result.operation, ok: result.ok, email: result.email, created: result.created}));
}
function nexusConnect_(params) {
  var bridge;
  try { bridge = nexusReturnContext_(params); } catch (error) { return nexusStyledOutput_('<p>La solicitud de Nexus Chat no es válida.</p>'); }
  var result;
  try {
    var account = nexusAccount_();
    People.People.Connections.list('people/me', {pageSize: 1, personFields: 'names'});
    result = {operation: 'connect', ok: true, email: account};
  } catch (error) { result = {operation: 'connect', ok: false}; }
  var message = result.ok ? 'Cuenta autorizada. Continúa para comprobarla en Nexus Chat.' : 'No se pudo autorizar la cuenta. Vuelve a Nexus Chat para intentarlo de nuevo.';
  return nexusStyledOutput_('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"></head><body><h1>Contactos · Nexus Chat</h1><p>' + message + '</p><a target="_top" href="' + nexusEscape_(nexusReturnURL_(bridge, result)) + '">Continuar en Nexus Chat</a></body></html>').setTitle('Contactos · Nexus Chat');
}

// Manual editor-only permission check. Never prints the account email or writes contacts.
function autorizarYComprobarCuenta() {
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ['https://www.googleapis.com/auth/contacts', 'https://www.googleapis.com/auth/userinfo.email']);
  if (!Session.getActiveUser().getEmail()) throw new Error('Google no devolvió el correo de la cuenta.');
  console.log('Permisos y acceso al correo comprobados.');
}


// Presentation-only revision: the existing revision-3 return protocol stays compatible.
function nexusStyledOutput_(html) {
  var style = '<style>:root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f0f2f5;color:#111b21;font:16px/1.55 system-ui,sans-serif}.nexus-connect-card{width:min(100%,440px);background:#fff;padding:32px 26px;border-radius:24px;box-shadow:0 12px 42px #142d3920;overflow-wrap:anywhere}.nexus-connect-card>img{display:block;width:48px;height:48px;margin-bottom:24px}h1{font-size:25px;line-height:1.2;margin:0 0 18px}p{margin:12px 0;color:#54656f}button,a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;border:0;border-radius:24px;padding:12px 22px;margin-top:12px;background:#128c7e;color:#fff;text-decoration:none;font:600 15px/1.4 system-ui;cursor:pointer}button:disabled{opacity:.65;cursor:wait}[hidden]{display:none!important}a:focus-visible,button:focus-visible{outline:3px solid #53bdeb;outline-offset:3px}@media(prefers-color-scheme:dark){body{background:#0a1014;color:#f7f8fa}.nexus-connect-card{background:#182126}p{color:#adb8bd}button,a{background:#21c063;color:#071a13}}</style>';
  if (html.indexOf('</head>') >= 0) html = html.replace('</head>', style + '</head>');
  else html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer">' + style + '</head><body>' + html + '</body></html>';
  html = html.replace('<body>', '<body><main class="nexus-connect-card"><img src="https://nexus-chat-nc.web.app/nexus-icon.svg" alt="Nexus Chat" width="48" height="48">').replace('</body>', '</main></body>');
  return HtmlService.createHtmlOutput(html);
}
