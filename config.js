
var path = require("./path.js");

module.exports = {

    finalDatabase : 'db.xml',
    assemblyScript : './assembly.sh',
    doctype : "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE pluginRecords [\n<!ELEMENT pluginRecords ((update-site | disabled-update-site)*, plugin*)>\n<!ELEMENT update-site EMPTY>\n<!ELEMENT disabled-update-site EMPTY>\n<!ELEMENT plugin (platform*, category*, version?, previous-version*)>\n<!ELEMENT version (description?, dependency*, link*, author*)>\n<!ELEMENT previous-version EMPTY>\n<!ELEMENT description (#PCDATA)>\n<!ELEMENT dependency EMPTY>\n<!ELEMENT link (#PCDATA)>\n<!ELEMENT author (#PCDATA)>\n<!ELEMENT platform (#PCDATA)>\n<!ELEMENT category (#PCDATA)>\n<!ATTLIST update-site name CDATA #REQUIRED>\n<!ATTLIST update-site url CDATA #REQUIRED>\n<!ATTLIST update-site ssh-host CDATA #IMPLIED>\n<!ATTLIST update-site upload-directory CDATA #IMPLIED>\n<!ATTLIST update-site description CDATA #IMPLIED>\n<!ATTLIST update-site maintainer CDATA #IMPLIED>\n<!ATTLIST update-site timestamp CDATA #REQUIRED>\n<!ATTLIST disabled-update-site name CDATA #REQUIRED>\n<!ATTLIST disabled-update-site url CDATA #REQUIRED>\n<!ATTLIST disabled-update-site ssh-host CDATA #IMPLIED>\n<!ATTLIST disabled-update-site upload-directory CDATA #IMPLIED>\n<!ATTLIST disabled-update-site description CDATA #IMPLIED>\n<!ATTLIST disabled-update-site maintainer CDATA #IMPLIED>\n<!ATTLIST disabled-update-site timestamp CDATA #REQUIRED>\n<!ATTLIST plugin update-site CDATA #IMPLIED>\n<!ATTLIST plugin filename CDATA #REQUIRED>\n<!ATTLIST plugin executable CDATA #IMPLIED>\n<!ATTLIST dependency filename CDATA #REQUIRED>\n<!ATTLIST dependency timestamp CDATA #IMPLIED>\n<!ATTLIST dependency overrides CDATA #IMPLIED>\n<!ATTLIST version timestamp CDATA #REQUIRED>\n<!ATTLIST version checksum CDATA #REQUIRED>\n<!ATTLIST version filesize CDATA #REQUIRED>\n<!ATTLIST previous-version filename CDATA #IMPLIED>\n<!ATTLIST previous-version timestamp CDATA #REQUIRED>\n<!ATTLIST previous-version checksum CDATA #REQUIRED>]>",
    data: "data.json",
    port : 8080,
    pwd:"",
    repo:path(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,"imagej-update-site")
}
