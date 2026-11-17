/** Nexus Chat: preparación del servicio de contactos. Publicar como usuario que accede. */
var NEXUS_CONTACTS_PROTOCOL_ = 'nexus-contacts-preview-v1';
var NEXUS_FIELDS_ = 'names,metadata,clientData,userDefined';
var NEXUS_LINK_ = 'nexusChat.contact.v1';
var NEXUS_NUMBER_ = 'Nexus Chat · número';
var NEXUS_USERNAME_ = 'Nexus Chat · usuario';

// Abrir /exec solo comprueba acceso. Nunca escribe ni devuelve la agenda.
function doGet() {
  try {
    nexusAccount_();
    People.People.Connections.list('people/me', {pageSize: 1, personFields: 'names'});
    return nexusJSON_({ok: true, protocolo: NEXUS_CONTACTS_PROTOCOL_, mensaje: 'Conexión con los contactos de Google correcta.'});
  } catch (error) {
    return nexusJSON_({ok: false, protocolo: NEXUS_CONTACTS_PROTOCOL_, mensaje: 'No se pudo comprobar la cuenta o el permiso de contactos.'});
  }
}

// Preparado para un envío POST por formulario desde Nexus, sin tokens en URLs.
// Este POST muestra una vista previa: la escritura requiere pulsar Guardar.
function doPost(event) {
  try {
    var account = nexusAccount_();
    var raw = event && event.parameter && event.parameter.contact;
    if (typeof raw !== 'string' || raw.length > 4096) throw new Error('CONTACT');
    var contact = nexusContact_(JSON.parse(raw));
    if (contact.email !== account) throw new Error('ACCOUNT');
    var ticket = Utilities.getUuid();
    CacheService.getUserCache().put('nexus-contact-draft:' + ticket, JSON.stringify(contact), 300);
    return HtmlService.createHtmlOutput(nexusPreview_(contact, account, ticket)).setTitle('Guardar contacto · Nexus Chat');
  } catch (error) {
    return HtmlService.createHtmlOutput('<!doctype html><html lang="es"><meta charset="utf-8"><p>No se pudo preparar el contacto. Comprueba tu cuenta de Google y vuelve a Nexus Chat.</p></html>').setTitle('Nexus Chat');
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
    return {ok: true, creado: !person};
  } catch (error) {
    // No raw provider errors, contact content or tokens in browser responses/logs.
    throw new Error('No se pudo confirmar el guardado. Revisa tu agenda antes de volver a intentarlo.');
  } finally {
    lock.releaseLock();
  }
}

function nexusAccount_() {
  var active = Session.getActiveUser().getEmail().toLowerCase();
  var effective = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!active || active !== effective) throw new Error('ACCOUNT');
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
function nexusPreview_(contact, account, ticket) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Guardar contacto · Nexus Chat</title></head><body>' +
    '<h1>Guardar contacto</h1><p>' + nexusEscape_([contact.first, contact.last].filter(Boolean).join(' ')) + '</p><p>Cuenta de destino: ' + nexusEscape_(account) + '</p>' +
    '<button id="save" type="button">Guardar contacto</button><p id="status" role="status"></p><script>' +
    'var button=document.getElementById("save"),statusNode=document.getElementById("status");button.onclick=function(){button.disabled=true;statusNode.textContent="Guardando…";' +
    'google.script.run.withSuccessHandler(function(){statusNode.textContent="Contacto guardado en tu cuenta de Google. Puedes volver a Nexus Chat.";})' +
    '.withFailureHandler(function(){statusNode.textContent="No se pudo confirmar el guardado. Revisa tu agenda antes de volver a intentarlo.";button.disabled=false;})' +
    '.saveNexusContact(' + JSON.stringify(ticket) + ');};</script></body></html>';
}
