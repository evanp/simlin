/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
goog.exportSymbol('proto.Project', null, global);

/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.Project = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.Project.repeatedFields_, null);
};
goog.inherits(proto.Project, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  proto.Project.displayName = 'proto.Project';
}
/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.Project.repeatedFields_ = [5,6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto suitable for use in Soy templates.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
 * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
 *     for transitional soy proto support: http://goto/soy-param-migration
 * @return {!Object}
 */
proto.Project.prototype.toObject = function(opt_includeInstance) {
  return proto.Project.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Whether to include the JSPB
 *     instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.Project} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.Project.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, ""),
    ownerId: jspb.Message.getFieldWithDefault(msg, 2, ""),
    isPublic: jspb.Message.getFieldWithDefault(msg, 3, false),
    description: jspb.Message.getFieldWithDefault(msg, 4, ""),
    tagsList: jspb.Message.getRepeatedField(msg, 5),
    collaboratorIdList: jspb.Message.getRepeatedField(msg, 6),
    version: jspb.Message.getFieldWithDefault(msg, 7, 0),
    fileId: jspb.Message.getFieldWithDefault(msg, 8, ""),
    created: (f = msg.getCreated()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
    updated: (f = msg.getUpdated()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.Project}
 */
proto.Project.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.Project;
  return proto.Project.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.Project} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.Project}
 */
proto.Project.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setOwnerId(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsPublic(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.addTags(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.addCollaboratorId(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setFileId(value);
      break;
    case 9:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreated(value);
      break;
    case 10:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setUpdated(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.Project.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.Project.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.Project} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.Project.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOwnerId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getIsPublic();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getDescription();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getTagsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      5,
      f
    );
  }
  f = message.getCollaboratorIdList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      6,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      7,
      f
    );
  }
  f = message.getFileId();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getCreated();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getUpdated();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.Project.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/** @param {string} value */
proto.Project.prototype.setId = function(value) {
  jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string owner_id = 2;
 * @return {string}
 */
proto.Project.prototype.getOwnerId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/** @param {string} value */
proto.Project.prototype.setOwnerId = function(value) {
  jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bool is_public = 3;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.Project.prototype.getIsPublic = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(this, 3, false));
};


/** @param {boolean} value */
proto.Project.prototype.setIsPublic = function(value) {
  jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional string description = 4;
 * @return {string}
 */
proto.Project.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/** @param {string} value */
proto.Project.prototype.setDescription = function(value) {
  jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * repeated string tags = 5;
 * @return {!Array<string>}
 */
proto.Project.prototype.getTagsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 5));
};


/** @param {!Array<string>} value */
proto.Project.prototype.setTagsList = function(value) {
  jspb.Message.setField(this, 5, value || []);
};


/**
 * @param {!string} value
 * @param {number=} opt_index
 */
proto.Project.prototype.addTags = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 5, value, opt_index);
};


proto.Project.prototype.clearTagsList = function() {
  this.setTagsList([]);
};


/**
 * repeated string collaborator_id = 6;
 * @return {!Array<string>}
 */
proto.Project.prototype.getCollaboratorIdList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 6));
};


/** @param {!Array<string>} value */
proto.Project.prototype.setCollaboratorIdList = function(value) {
  jspb.Message.setField(this, 6, value || []);
};


/**
 * @param {!string} value
 * @param {number=} opt_index
 */
proto.Project.prototype.addCollaboratorId = function(value, opt_index) {
  jspb.Message.addToRepeatedField(this, 6, value, opt_index);
};


proto.Project.prototype.clearCollaboratorIdList = function() {
  this.setCollaboratorIdList([]);
};


/**
 * optional int32 version = 7;
 * @return {number}
 */
proto.Project.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/** @param {number} value */
proto.Project.prototype.setVersion = function(value) {
  jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional string file_id = 8;
 * @return {string}
 */
proto.Project.prototype.getFileId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/** @param {string} value */
proto.Project.prototype.setFileId = function(value) {
  jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional google.protobuf.Timestamp created = 9;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.Project.prototype.getCreated = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 9));
};


/** @param {?proto.google.protobuf.Timestamp|undefined} value */
proto.Project.prototype.setCreated = function(value) {
  jspb.Message.setWrapperField(this, 9, value);
};


proto.Project.prototype.clearCreated = function() {
  this.setCreated(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.Project.prototype.hasCreated = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional google.protobuf.Timestamp updated = 10;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.Project.prototype.getUpdated = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 10));
};


/** @param {?proto.google.protobuf.Timestamp|undefined} value */
proto.Project.prototype.setUpdated = function(value) {
  jspb.Message.setWrapperField(this, 10, value);
};


proto.Project.prototype.clearUpdated = function() {
  this.setUpdated(undefined);
};


/**
 * Returns whether this field is set.
 * @return {!boolean}
 */
proto.Project.prototype.hasUpdated = function() {
  return jspb.Message.getField(this, 10) != null;
};


goog.object.extend(exports, proto);
