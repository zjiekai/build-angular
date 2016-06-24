'use strict';

var _ = require('lodash');

function parse(expr) {
  var lexer = new Lexer();
  var parser = new Parser(lexer);
  return parser.parse(expr);
}

function Lexer() {
}

Lexer.prototype.lex = function(text) {
  this.text = text;
  this.index = 0;
  this.ch = undefined;
  this.tokens = [];

  while (this.index < this.text.length) {
    this.ch = this.text.charAt(this.index);
    if (this.isNumber(this.ch) || 
        (this.ch === '.' && this.isNumber(this.peek()))) {
      this.readNumber();
    } else if (this.is('\'"')) {
      this.readString(this.ch);
    } else if (this.is('[],{}:.()=')) {
      this.tokens.push({
        text: this.ch
      });
      this.index++;
    } else if (this.isIdent(this.ch)) {
      this.readIdent();
    } else if (this.isWhitespace(this.ch)) {
      this.index++;
    } else {
      throw 'Unexpected next character: ' + this.ch;
    }
  }

  return this.tokens;
};

Lexer.prototype.is = function(chs) {
  return chs.indexOf(this.ch) >= 0;
};

Lexer.prototype.peek = function() {
  return this.index < this.text.length - 1 ?
    this.text.charAt(this.index + 1) : false;
};

Lexer.prototype.isNumber = function(ch) {
  return '0' <= ch && ch <= '9';
};

Lexer.prototype.readNumber = function() {
  var number = '';
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    if (ch === '.' || this.isNumber(ch)) {
      number += ch;
    } else {
      break;
    }
    this.index++;
  }
  this.tokens.push({
    text: number,
    value: Number(number)
  });
};

var ESCAPES = {'n': '\n', 'f': '\f', 'r': '\r', 't': '\t',
               'v': '\v', "'": '\'', '"': '"'};

Lexer.prototype.readString = function(quote) {
  this.index++;
  var string = '';
  var escape = false;
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    if (escape) {
      if (ch === 'u') {
        var hex = this.text.substring(this.index + 1, this.index + 5);
        this.index += 4;
        string += String.fromCharCode(parseInt(hex, 16));
      } else {
        var replacement = ESCAPES[ch];
        if (replacement) {
          string += replacement;
        } else {
          string += ch;
        }
      }
      escape = false;
    } else if (ch === quote) {
      this.index++;
      this.tokens.push({
        text: string,
        value: string
      });
      return;
    } else if (ch === '\\') {
      escape = true;
    } else {
      string += ch;
    }
    this.index++;
  }
  throw 'Unmatched quote';
};

Lexer.prototype.isIdent = function(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
    (ch === '_') || (ch === '$');
};

Lexer.prototype.isWhitespace = function(ch) {
  return ch === ' ' || ch === '\r' || ch === '\t' ||
      ch === '\n' || ch === '\v' || ch === '\u00A0';
};

Lexer.prototype.readIdent = function() {
  var text = '';
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    if (this.isIdent(ch) || this.isNumber(ch)) {
      text += ch;
    } else {
      break;
    }
    this.index++;
  }

  var token = {
    text: text,
    identifier: true
  };
  this.tokens.push(token);
};

function AST(lexer) {
  this.lexer = lexer;
}
AST.Program = 'Program';
AST.Literal = 'Literal';
AST.ArrayExpression = 'ArrayExpression';
AST.ObjectExpression = 'ObjectExpression';
AST.Property = 'Property';
AST.Identifier = 'Identifier';
AST.ThisExpression = 'ThisExpression';
AST.MemberExpression = 'MemberExpression';
AST.CallExpression = 'CallExpression';
AST.AssignmentExpression = 'AssignmentExpression';

AST.prototype.constants = {
  'null': {type: AST.Literal, value: null},
  'true': {type: AST.Literal, value: true},
  'false': {type: AST.Literal, value: false},
  'this': {type: AST.ThisExpression}
};

AST.prototype.ast = function(text) {
  this.tokens = this.lexer.lex(text);
  return this.program();
};

AST.prototype.assignment = function() {
  var left = this.primary();
  if (this.expect('=')) {
    var right = this.primary();
    return {type: AST.AssignmentExpression, left: left, right: right};
  }
  return left;
};

AST.prototype.program = function() {
  return {type: AST.Program, body: this.assignment()};
};

AST.prototype.primary = function() {
  var primary;
  if (this.expect('[')) {
    primary = this.arrayDeclaration();
  } else if (this.expect('{')) {
    primary = this.object();
  } else if (this.constants.hasOwnProperty(this.tokens[0].text)) {
    primary = this.constants[this.consume().text];
  } else if (this.peek().identifier) {
    primary = this.identifier();
  } else {
    primary = this.constant();
  }

  var next;
  while ((next = this.expect('.', '[', '('))) {
    if (next.text === '[') {
      primary = {
        type: AST.MemberExpression,
        object: primary,
        property: this.primary(),
        computed: true
      };
      this.consume(']');
    } else if (next.text === '.') {
      primary = {
        type: AST.MemberExpression,
        object: primary,
        property: this.identifier(),
        computed: false
      };
    } else if (next.text === '(') {
      primary = {type: AST.CallExpression, callee: primary};
      this.consume(')');
    }
  }
  return primary;
};

AST.prototype.expect = function(e1, e2, e3, e4) {
  var token = this.peek(e1, e2, e3, e4);
  if (token) {
    return this.tokens.shift();
  }
};

AST.prototype.object = function() {
  var properties = [];
  if (!this.peek('}')) {
    do {
      var property = {type: AST.Property};
      if (this.peek().identifier) {
        property.key = this.identifier();
      } else {
        property.key = this.constant();
      }
      this.consume(":");
      property.value = this.primary();
      properties.push(property);
    } while (this.expect(','));
  }
  this.consume('}');
  return {type: AST.ObjectExpression, properties: properties};
};

AST.prototype.identifier = function() {
  return {type: AST.Identifier, name: this.consume().text};
};

AST.prototype.arrayDeclaration = function() {
  var elements = [];
  if (!this.peek(']')) {
    do {
      if (this.peek(']')) {
        break;
      }
      elements.push(this.primary());
    } while (this.expect(','));
  }
  this.consume(']');
  return {type: AST.ArrayExpression, elements: elements};
};

AST.prototype.peek = function(e1, e2, e3, e4) {
  if (this.tokens.length > 0) {
    var text = this.tokens[0].text;
    if (text === e1 || text === e2 || text === e3 || text === e4 ||
      (!e1 && !e2 && !e3 && !e4)) {
      return this.tokens[0];
    }
  }
};

AST.prototype.consume = function(e) {
  var token = this.expect(e);
  if (!token) {
    throw 'Unexpected. Expecting: ' + e;
  }
  return token;
};

AST.prototype.constant = function() {
  return {type: AST.Literal, value: this.consume().value};
};

function ASTCompiler(astBuilder) {
  this.astBuilder = astBuilder;
}

ASTCompiler.prototype.compile = function(text) {
  var ast = this.astBuilder.ast(text);
  this.state = {body: [], nextId: 0, vars: []};
  this.recurse(ast);
  /* jshint -W054 */
  return new Function('s', 'l',
    (this.state.vars.length ?
      'var ' + this.state.vars.join(',') + ';' :
      ''
    ) + this.state.body.join(''));
  /* jshint +W054 */
};

ASTCompiler.prototype.if_ = function(test, consequent) {
  this.state.body.push('if(', test, '){', consequent, '}');
};

ASTCompiler.prototype.not = function(e) {
  return '!(' + e + ')';
};

ASTCompiler.prototype.getHasOwnProperty = function(object, property) {
  return object + '&&(' + this.escape(property) + ' in ' + object + ')';
};

ASTCompiler.prototype.assign = function(id, value) {
  return id + '=' + value + ';';
};

ASTCompiler.prototype.nextId = function() {
  var id = 'v' + (this.state.nextId++);
  this.state.vars.push(id);
  return id;
};

ASTCompiler.prototype.nonComputedMember = function(left, right) {
  return '(' + left + ').' + right;
};

ASTCompiler.prototype.computedMember = function(left, right) {
  return '(' + left + ')[' + right + ']';
};

ASTCompiler.prototype.recurse = function(ast, context) {
  var intoId;
  switch (ast.type) {
    case AST.Program:
      this.state.body.push('return ', this.recurse(ast.body), ';');
      break;
    case AST.Literal:
      return this.escape(ast.value);
    case AST.ObjectExpression:
      var properties = _.map(ast.properties, _.bind(function(property) {
        var key = property.key.type === AST.Identifier ?
          property.key.name :
          this.escape(property.key.value);
        var value = this.recurse(property.value);
        return key + ':' + value;
      }, this));
      return '{' + properties.join(',') + '}';
    case AST.ArrayExpression:
      var elements = _.map(ast.elements, _.bind(function(element) {
        return this.recurse(element);
      }, this));
      return '[' + elements.join(',') + ']';
    case AST.Identifier:
      intoId = this.nextId();
      this.if_(this.getHasOwnProperty('l', ast.name),
        this.assign(intoId, this.nonComputedMember('l', ast.name)));
      this.if_(this.not(this.getHasOwnProperty('l', ast.name)) + ' && s',
        this.assign(intoId, this.nonComputedMember('s', ast.name)));
      if (context) {
        context.context = this.getHasOwnProperty('l', ast.name) + '?l:s';
        context.name = ast.name;
        context.computed = false;
      }
      return intoId;
    case AST.ThisExpression:
      return 's';
    case AST.MemberExpression:
      intoId = this.nextId();
      var left = this.recurse(ast.object);
      if (context) {
        context.context = left;
      }
      if (ast.computed) {
        var right = this.recurse(ast.property);
        this.if_(left,
          this.assign(intoId, this.computedMember(left, right)));
        if (context) {
          context.name = right;
          context.computed = true;
        }
      } else {
        this.if_(left,
          this.assign(intoId, this.nonComputedMember(left, ast.property.name)));
        if (context) {
          context.name = ast.property.name;
          context.computed = false;
        }
      }
      return intoId;
    case AST.AssignmentExpression:
      var leftContext = {};
      this.recurse(ast.left, leftContext);
      var leftExpr;
      if (leftContext.computed) {
        leftExpr = this.computedMember(leftContext.context, leftContext.name);
      } else {
        leftExpr = this.nonComputedMember(leftContext.context, leftContext.name);
      }
      return this.assign(leftExpr, this.recurse(ast.right));
    case AST.CallExpression:
      var callee = this.recurse(ast.callee);
      return callee + '&&' + callee + '()';
  }
};

ASTCompiler.prototype.escape = function(value) {
  if (_.isString(value)) {
    return '\'' + 
      value.replace(this.stringEscapeRegex, this.stringEscapeFn) + 
      '\'';
  } else if (_.isNull(value)) {
    return 'null';
  } else {
    return value;
  }
};

ASTCompiler.prototype.stringEscapeRegex = /[^ a-zA-Z0-9]/g;

ASTCompiler.prototype.stringEscapeFn = function(c) {
  return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
};

function Parser(lexer) {
  this.lexer = lexer;
  this.ast = new AST(this.lexer);
  this.astCompiler = new ASTCompiler(this.ast);
}

Parser.prototype.parse = function(text) {
  return this.astCompiler.compile(text);
};

module.exports = parse;
