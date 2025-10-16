"use strict";
var ExprTokenType;
(function(ExprTokenType) {
    // Single Character Tokens
    ExprTokenType[ExprTokenType["QUESTION_MARK"] = 0] = "QUESTION_MARK";
    ExprTokenType[ExprTokenType["COLON"] = 1] = "COLON";
    ExprTokenType[ExprTokenType["MINUS"] = 2] = "MINUS";
    ExprTokenType[ExprTokenType["PLUS"] = 3] = "PLUS";
    ExprTokenType[ExprTokenType["SLASH"] = 4] = "SLASH";
    ExprTokenType[ExprTokenType["STAR"] = 5] = "STAR";
    ExprTokenType[ExprTokenType["CARET"] = 6] = "CARET";
    ExprTokenType[ExprTokenType["LEFT_PAREN"] = 7] = "LEFT_PAREN";
    ExprTokenType[ExprTokenType["RIGHT_PAREN"] = 8] = "RIGHT_PAREN";
    ExprTokenType[ExprTokenType["COMMA"] = 9] = "COMMA";
    ExprTokenType[ExprTokenType["DOT"] = 10] = "DOT";
    ExprTokenType[ExprTokenType["PERCENT"] = 11] = "PERCENT";
    // One or two character Tokens
    ExprTokenType[ExprTokenType["DOUBLE_PIPE"] = 12] = "DOUBLE_PIPE";
    ExprTokenType[ExprTokenType["DOUBLE_AMPERSAND"] = 13] = "DOUBLE_AMPERSAND";
    ExprTokenType[ExprTokenType["BANG"] = 14] = "BANG";
    ExprTokenType[ExprTokenType["BANG_EQUAL"] = 15] = "BANG_EQUAL";
    ExprTokenType[ExprTokenType["DOUBLE_EQUAL"] = 16] = "DOUBLE_EQUAL";
    ExprTokenType[ExprTokenType["GREATER"] = 17] = "GREATER";
    ExprTokenType[ExprTokenType["GREATER_EQUAL"] = 18] = "GREATER_EQUAL";
    ExprTokenType[ExprTokenType["LESS"] = 19] = "LESS";
    ExprTokenType[ExprTokenType["LESS_EQUAL"] = 20] = "LESS_EQUAL";
    // Literals
    ExprTokenType[ExprTokenType["NUMBER"] = 21] = "NUMBER";
    ExprTokenType[ExprTokenType["IDENTIFIER"] = 22] = "IDENTIFIER";
    // Keywords
    ExprTokenType[ExprTokenType["TRUE"] = 23] = "TRUE";
    ExprTokenType[ExprTokenType["FALSE"] = 24] = "FALSE";
    // End Of String
    ExprTokenType[ExprTokenType["EOS"] = 25] = "EOS";
})(ExprTokenType || (ExprTokenType = {}));
class ExprToken {
    constructor(type, lexeme, literal, line, column) {
        this.type = type;
        this.lexeme = lexeme;
        if (literal !== undefined)
            this.literal = literal;
        this.line = line;
        this.column = column;
    }
    toString() {
        return `${ExprTokenType[this.type]} ${this.lexeme} ${this.literal}`;
    }
}
class ExprError {
    constructor(token, message) {
        this.line = token.line;
        this.column = token.column;
        this.message = message;
    }
}
var ExprPrimaryType;
(function(ExprPrimaryType) {
    ExprPrimaryType[ExprPrimaryType["NumberBool"] = 0] = "NumberBool";
    ExprPrimaryType[ExprPrimaryType["Number"] = 1] = "Number";
    ExprPrimaryType[ExprPrimaryType["Boolean"] = 2] = "Boolean";
})(ExprPrimaryType || (ExprPrimaryType = {}));
const expressions = (() => {
    class ExprScanner {
        constructor(source) {
            this.source = source;
            this.tokens = [];
            this.errors = [];
            /** Position of first character in lexeme being scanned */
            this.start = 0;
            /** Position of current character in lexeme being scanned */
            this.current = 0;
            /** Current line of the current position in the expression string */
            this.line = 0;
            /** Current column of the current position in the expression string */
            this.column = 0;
        }
        scanTokens() {
            while (!this.isAtEnd()) {
                this.start = this.current;
                this.scanToken();
            }
            this.tokens.push(new ExprToken(ExprTokenType.EOS, '', 0, this.line, this.column));
            return {
                tokens: this.tokens,
                errors: this.errors
            };
        }
        scanToken() {
            const char = this.advance();
            switch (char) {
                case '?':
                    this.addToken(ExprTokenType.QUESTION_MARK);
                    break;
                case ':':
                    this.addToken(ExprTokenType.COLON);
                    break;
                case '-':
                    this.addToken(ExprTokenType.MINUS);
                    break;
                case '+':
                    this.addToken(ExprTokenType.PLUS);
                    break;
                case '/':
                    this.addToken(ExprTokenType.SLASH);
                    break;
                case '*':
                    this.addToken(ExprTokenType.STAR);
                    break;
                case '^':
                    this.addToken(ExprTokenType.CARET);
                    break;
                case '(':
                    this.addToken(ExprTokenType.LEFT_PAREN);
                    break;
                case ')':
                    this.addToken(ExprTokenType.RIGHT_PAREN);
                    break;
                case ',':
                    this.addToken(ExprTokenType.COMMA);
                    break;
                case '.':
                    this.addToken(ExprTokenType.DOT);
                    break;
                case '%':
                    this.addToken(ExprTokenType.PERCENT);
                    break;
                case '|':
                    if (this.match('|')) {
                        this.addToken(ExprTokenType.DOUBLE_PIPE);
                    } else {
                        this.addError(`Unexpected operator: ${char}. Expected '||'.`);
                    }
                    break;
                case '&':
                    if (this.match('&')) {
                        this.addToken(ExprTokenType.DOUBLE_AMPERSAND);
                    } else {
                        this.addError(`Unexpected operator: ${char}. Expected '&&'.`);
                    }
                    break;
                case '!':
                    this.addToken(this.match('=') ? ExprTokenType.BANG_EQUAL : ExprTokenType.BANG);
                    break;
                case '=':
                    if (this.match('=')) {
                        this.addToken(ExprTokenType.DOUBLE_EQUAL);
                    } else {
                        this.addError(`Unexpected operator: ${char}. Expected '=='.`);
                    }
                    break;
                case '>':
                    this.addToken(this.match('=') ? ExprTokenType.GREATER_EQUAL : ExprTokenType.GREATER);
                    break;
                case '<':
                    this.addToken(this.match('=') ? ExprTokenType.LESS_EQUAL : ExprTokenType.LESS);
                    break;
                case ' ':
                case '\t':
                case '\r':
                    // Ignore whitespace
                    break;
                case '\n':
                    this.increaseLine();
                    break;
                default:
                    if (this.isDigit(char)) {
                        this.number();
                    } else if (this.isAlpha(char)) {
                        this.identifier();
                    } else {
                        this.addError(`Unexpected character: ${char}`);
                    }
            }
        }
        /** Advances the scanner by 1 character */
        advance() {
            this.column++;
            return this.source.charAt(this.current++);
        }
        /** Adds a new token of the given type */
        addToken(type, literal) {
            const text = this.source.substring(this.start, this.current);
            this.tokens.push(new ExprToken(type, text, literal, this.line, this.column));
        }
        addError(message) {
            this.errors.push({
                line: this.line,
                column: this.column,
                message,
            });
        }
        increaseLine() {
            this.line++;
            this.column = 0;
        }
        /**
         * Consumes a character if it matches expected. Returns true if a character was consumed.
         */
        match(expected) {
            if (this.isAtEnd())
                return false;
            if (this.source.charAt(this.current) !== expected)
                return false;
            this.current++;
            return true;
        }
        /**
         * Looks ahead to see the next character after the one currently being consumed
         * @returns The next character in the source
         */
        peek() {
            if (this.isAtEnd())
                return '\0';
            return this.source.charAt(this.current);
        }
        /**
         * Looks ahead to see the character 2 ahead of the one currently being consumed
         */
        peekNext() {
            const next = this.current + 1;
            if (next >= this.source.length)
                return '\0';
            return this.source.charAt(next);
        }
        /** Checks if a character is [0-9] */
        isDigit(char) {
            const charCode = char.charCodeAt(0);
            return charCode >= ExprScanner.ZERO_CHARCODE && charCode <= ExprScanner.NINE_CHARCODE;
        }
        /** Checks if a character is [a-zA-Z_] */
        isAlpha(char) {
            const charCode = char.charCodeAt(0);
            return ((charCode >= ExprScanner.a_CHARCODE && charCode <= ExprScanner.z_CHARCODE) ||
                (charCode >= ExprScanner.A_CHARCODE && charCode <= ExprScanner.Z_CHARCODE) ||
                charCode === ExprScanner.UNDERSCORE_CHARCODE);
        }
        /** Checks if a character is [a-zA-Z_0-9] */
        isAlphaNumeric(char) {
            return this.isDigit(char) || this.isAlpha(char);
        }
        /** Consumes digit [0-9] characters until one is not encountered */
        consumeDigits() {
            while (this.isDigit(this.peek()))
                this.advance();
        }
        /** Consumes characters to generate a Number token */
        number() {
            this.consumeDigits();
            // Look for fractional part and consume that
            if (this.peek() === '.' && this.isDigit(this.peekNext())) {
                this.advance(); // Consume "."
                this.consumeDigits();
            }
            this.addToken(ExprTokenType.NUMBER, Number.parseFloat(this.source.substring(this.start, this.current)));
        }
        /** Consumes alphanumeric [a-zA-Z_0-9] characters until one is not encountered */
        consumeAlphaNumeric() {
            while (this.isAlphaNumeric(this.peek()))
                this.advance();
        }
        /** Consumes characters to generate an identifier token, or a keyword */
        identifier() {
            this.consumeAlphaNumeric();
            const text = this.source.substring(this.start, this.current);
            const type = text in ExprScanner.KEYWORDS ? ExprScanner.KEYWORDS[text] : ExprTokenType.IDENTIFIER;
            this.addToken(type);
        }
        /** If all characters of the source have been consumed */
        isAtEnd() {
            return this.current >= this.source.length;
        }
    }
    ExprScanner.ZERO_CHARCODE = '0'.charCodeAt(0);
    ExprScanner.NINE_CHARCODE = '9'.charCodeAt(0);
    ExprScanner.a_CHARCODE = 'a'.charCodeAt(0);
    ExprScanner.z_CHARCODE = 'z'.charCodeAt(0);
    ExprScanner.A_CHARCODE = 'A'.charCodeAt(0);
    ExprScanner.Z_CHARCODE = 'Z'.charCodeAt(0);
    ExprScanner.UNDERSCORE_CHARCODE = '_'.charCodeAt(0);
    ExprScanner.KEYWORDS = {
        false: ExprTokenType.FALSE,
        true: ExprTokenType.TRUE,
    };
    /** Recursive descent parser for expressions */
    class ExprParser {
        constructor(tokens) {
            this.current = 0;
            this.errors = [];
            this.tokens = tokens;
        }
        /** Parses the tokens supplied to this parser into an expression. Returns a result, and any errors that occured during parsing. */
        parse() {
            let result;
            try {
                result = this.expression();
                if (!this.isAtEnd()) {
                    this.advance();
                    throw this.error(this.previous(), 'Expected single expression.');
                }
            } catch (e) {
                result = undefined;
            }
            return {
                result,
                errors: this.errors
            };
        }
        /** expression -> tenary ; */
        expression() {
            return this.ternary();
        }
        /** tenary -> logic_or ("?" ternary ":" ternary)? ; */
        ternary() {
            let expr = this.logicOr();
            if (this.match(ExprTokenType.QUESTION_MARK)) {
                const operator = this.previous();
                const left = this.ternary();
                this.consume(ExprTokenType.COLON, "Expect ':' after left-hand ternary branch.");
                const right = this.ternary();
                expr = new TernaryExpr(expr, operator, left, right);
            }
            return expr;
        }
        /** logic_or -> logic_and ( "||" logic_and )* ; */
        logicOr() {
            let expr = this.logicAnd();
            while (this.match(ExprTokenType.DOUBLE_PIPE)) {
                const operator = this.previous();
                const right = this.logicAnd();
                expr = new LogicalExpr(expr, operator, right);
            }
            return expr;
        }
        /** logic_and -> equality ( "&&" equality )* ; */
        logicAnd() {
            let expr = this.equality();
            while (this.match(ExprTokenType.DOUBLE_AMPERSAND)) {
                const operator = this.previous();
                const right = this.equality();
                expr = new LogicalExpr(expr, operator, right);
            }
            return expr;
        }
        /** equality -> comparison ( ( "!=" | "==" ) comparison )* ; */
        equality() {
            let expr = this.comparison();
            while (this.match(ExprTokenType.BANG_EQUAL, ExprTokenType.DOUBLE_EQUAL)) {
                const operator = this.previous();
                const right = this.comparison();
                expr = new BinaryExpr(expr, operator, right);
            }
            return expr;
        }
        /** comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ; */
        comparison() {
            let expr = this.term();
            while (this.match(ExprTokenType.GREATER, ExprTokenType.GREATER_EQUAL, ExprTokenType.LESS, ExprTokenType.LESS_EQUAL)) {
                const operator = this.previous();
                const right = this.term();
                expr = new BinaryExpr(expr, operator, right);
            }
            return expr;
        }
        /** term -> factor ( ( "-" | "+" ) factor )* ; */
        term() {
            let expr = this.factor();
            while (this.match(ExprTokenType.MINUS, ExprTokenType.PLUS)) {
                const operator = this.previous();
                const right = this.factor();
                expr = new BinaryExpr(expr, operator, right);
            }
            return expr;
        }
        /** factor -> power ( ("/" | "*" | "%") power )* ; */
        factor() {
            let expr = this.power();
            while (this.match(ExprTokenType.SLASH, ExprTokenType.STAR, ExprTokenType.PERCENT)) {
                const operator = this.previous();
                const right = this.power();
                expr = new BinaryExpr(expr, operator, right);
            }
            return expr;
        }
        /** power -> unary ( ^ unary)* ; */
        power() {
            let expr = this.unary();
            while (this.match(ExprTokenType.CARET)) {
                const operator = this.previous();
                const right = this.unary();
                expr = new BinaryExpr(expr, operator, right);
            }
            return expr;
        }
        /** unary -> ("!" | "-") unary | primary ; */
        unary() {
            if (this.match(ExprTokenType.BANG, ExprTokenType.MINUS)) {
                const operator = this.previous();
                const right = this.unary();
                return new UnaryExpr(operator, right);
            }
            return this.primary();
        }
        /** primary -> "true" | "false" | NUMBER | reference | builtIn | "(" expression ")"; */
        primary() {
            // Literal Types
            if (this.match(ExprTokenType.TRUE))
                return new LiteralExpr(true);
            if (this.match(ExprTokenType.FALSE))
                return new LiteralExpr(false);
            if (this.match(ExprTokenType.NUMBER))
                return new LiteralExpr(this.previous().literal);
            // Grouping
            if (this.match(ExprTokenType.LEFT_PAREN)) {
                const expression = this.expression();
                this.consume(ExprTokenType.RIGHT_PAREN, `Expected ')' after expression.`);
                return new GroupingExpr(expression);
            }
            // Built in Functions + References
            if (this.match(ExprTokenType.IDENTIFIER)) {
                const identifier = this.previous();
                if (this.match(ExprTokenType.LEFT_PAREN)) {
                    return this.builtIn(identifier);
                } else {
                    return this.reference(identifier);
                }
            }
            // Invalid Syntax
            throw this.error(this.peek(), 'Expected expression.');
        }
        /** builtIn -> IDENTIFIER "(" (expression ( "," expression )*)? ")" ; */
        builtIn(name) {
            const paren = this.previous();
            const callArgs = [];
            if (!this.check(ExprTokenType.RIGHT_PAREN)) {
                callArgs.push(this.expression());
                while (this.match(ExprTokenType.COMMA)) {
                    callArgs.push(this.expression());
                }
            }
            this.consume(ExprTokenType.RIGHT_PAREN, `Expected ')' after arguments.`);
            return new BuiltInExpr(name, paren, callArgs);
        }
        /** reference -> IDENTIFIER ("." IDENTIFIER )* ; */
        reference(firstName) {
            const names = [firstName];
            while (this.match(ExprTokenType.DOT)) {
                this.consume(ExprTokenType.IDENTIFIER, "Expected property name after '.'.");
                names.push(this.previous());
            }
            return new ReferenceExpr(names);
        }
        // Utility methods
        /** Checks if there are no more tokens to parse */
        isAtEnd() {
            return this.peek().type === ExprTokenType.EOS;
        }
        /** Gets the current token, without consuming it */
        peek() {
            return this.tokens[this.current];
        }
        /** Gets the most recently consumed token */
        previous() {
            return this.tokens[this.current - 1];
        }
        /** Consumes the current token, and returns it */
        advance() {
            if (!this.isAtEnd())
                this.current++;
            return this.previous();
        }
        /** Checks if the current token matches any of the given types, consuming it if so */
        match(...types) {
            for (const type of types) {
                if (this.check(type)) {
                    this.advance();
                    return true;
                }
            }
            return false;
        }
        /** Checks if the current token is of a given type, but does not consume it */
        check(type) {
            if (this.isAtEnd())
                return false;
            return this.peek().type === type;
        }
        /** Consumes a token of the given type. Reporting message as an error if the token type did not exist */
        consume(type, message) {
            if (this.check(type))
                return this.advance();
            throw this.error(this.peek(), message);
        }
        /** Gets a new Parsing Error object, and records the parsing error. */
        error(token, message) {
            if (token.type === ExprTokenType.EOS) {
                this.reportError(token, ' at end', message);
            } else {
                this.reportError(token, ` at '${token.lexeme}'`, message);
            }
            return new ParseError();
        }
        reportError(token, at, message) {
            this.errors.push({
                message: `Error${at}: ${message}`,
                line: token.line,
                column: token.column,
            });
        }
    }
    class ParseError extends Error {}
    class ExprReferenceNode {
        constructor() {
            /** Child nodes that can be indexed into */
            this.children = new Map();
            /** Properties that can be directly accessed from this node */
            this.properties = new Map();
        }
        addChild(name, node) {
            if (this.children.has(name))
                throw new Error(`Child already exists with name ${name}.`);
            this.children.set(name, node);
        }
        addProperties(names, type) {
            names.forEach((name) => {
                if (this.properties.has(name))
                    throw new Error(`Property already exists with name ${name}.`);
                this.properties.set(name, type);
            });
        }
    }
    class ExprConfig {
        constructor(builtIns, references) {
            this.builtIns = new Map();
            builtIns.forEach((builtIn) => {
                this.builtIns.set(builtIn.name, builtIn);
            });
            this.references = references;
        }
    }
    class ExprValidator {
        constructor(config) {
            this.config = config;
            this.errors = [];
        }
        validateExpression(expr) {
            this.errors = [];
            this.validate(expr);
            return this.errors;
        }
        validate(expr) {
            expr.accept(this);
        }
        visitTernaryExpr(expr) {
            this.validate(expr.condition);
            this.validate(expr.left);
            this.validate(expr.right);
        }
        visitLogicalExpr(expr) {
            this.validate(expr.left);
            this.validate(expr.right);
        }
        visitBinaryExpr(expr) {
            this.validate(expr.left);
            this.validate(expr.right);
        }
        visitUnaryExpr(expr) {
            this.validate(expr.right);
        }
        visitLiteralExpr(expr) {}
        visitBuiltInExpr(expr) {
            const builtIn = this.config.builtIns.get(expr.name.lexeme);
            // Validate that the function exists, and the correct amount of arguments were used
            if (builtIn === undefined) {
                this.errors.push(new ExprError(expr.name, `No function exists with the name '${expr.name.lexeme}'.`));
            } else if (builtIn.args.length !== expr.callArgs.length) {
                this.errors.push(new ExprError(expr.name, `Error using '${expr.name.lexeme}. Expected ${builtIn.args.length} arguments but got ${expr.callArgs.length}.'`));
            }
            for (const arg of expr.callArgs) {
                this.validate(arg);
            }
        }
        visitReferenceExpr(expr) {
            let referenceNode = this.config.references;
            let fullName = '';
            for (let i = 0; i < expr.names.length; i++) {
                const atEnd = i === expr.names.length - 1;
                const name = expr.names[i];
                fullName += name.lexeme;
                if (atEnd) {
                    const property = referenceNode.properties.get(name.lexeme);
                    if (property === undefined) {
                        this.errors.push(new ExprError(name, `No reference exists with the name '${fullName}'.`));
                        break;
                    }
                } else {
                    const nextNode = referenceNode.children.get(name.lexeme);
                    if (nextNode === undefined) {
                        this.errors.push(new ExprError(name, `No reference exists with the name '${fullName}'.`));
                        break;
                    } else {
                        referenceNode = nextNode;
                    }
                }
                if (!atEnd)
                    fullName += '.';
            }
        }
        visitGroupingExpr(expr) {
            this.validate(expr.expression);
        }
    }
    class ExprTypeChecker {
        constructor(config) {
            this.config = config;
            this.errors = [];
        }
        getExpressionType(expr) {
            this.errors = [];
            const type = this.getType(expr);
            return {
                type,
                errors: this.errors
            };
        }
        getType(expr) {
            return expr.accept(this);
        }
        visitTernaryExpr(expr) {
            this.getType(expr.condition); // We support truthiness, so condition type doesn't matter
            const leftType = this.getType(expr.left);
            const rightType = this.getType(expr.right);
            return this.getCombinedTypes(leftType, rightType);
        }
        visitLogicalExpr(expr) {
            const leftType = this.getType(expr.left);
            const rightType = this.getType(expr.right);
            switch (expr.operator.type) {
                case ExprTokenType.DOUBLE_PIPE:
                case ExprTokenType.DOUBLE_AMPERSAND:
                    return this.getCombinedTypes(leftType, rightType);
                default:
                    throw new Error(`Type checker does not support logical operator '${expr.operator.lexeme}'.`);
            }
        }
        visitBinaryExpr(expr) {
            const leftType = this.getType(expr.left);
            const rightType = this.getType(expr.right);
            switch (expr.operator.type) {
                case ExprTokenType.BANG_EQUAL:
                case ExprTokenType.DOUBLE_EQUAL:
                    return ExprPrimaryType.Boolean;
                case ExprTokenType.GREATER:
                case ExprTokenType.GREATER_EQUAL:
                case ExprTokenType.LESS:
                case ExprTokenType.LESS_EQUAL:
                    this.logOperatorError(expr.operator, 'Left expression', ExprPrimaryType.Number, leftType);
                    this.logOperatorError(expr.operator, 'Right expression', ExprPrimaryType.Number, rightType);
                    return ExprPrimaryType.Boolean;
                case ExprTokenType.MINUS:
                case ExprTokenType.PLUS:
                case ExprTokenType.SLASH:
                case ExprTokenType.STAR:
                case ExprTokenType.CARET:
                case ExprTokenType.PERCENT:
                    this.logOperatorError(expr.operator, 'Left expression', ExprPrimaryType.Number, leftType);
                    this.logOperatorError(expr.operator, 'Right expression', ExprPrimaryType.Number, rightType);
                    return ExprPrimaryType.Number;
                default:
                    throw new Error(`Type checker does not support binary operator '${expr.operator.lexeme}'.`);
            }
        }
        visitUnaryExpr(expr) {
            const rightType = this.getType(expr.right);
            switch (expr.operator.type) {
                case ExprTokenType.BANG:
                    // We support truthiness
                    return ExprPrimaryType.Boolean;
                case ExprTokenType.MINUS:
                    this.logOperatorError(expr.operator, 'Right expression', ExprPrimaryType.Number, rightType);
                    return ExprPrimaryType.Number;
                default:
                    throw new Error(`Type checker does not support unary operator '${expr.operator.lexeme}'.`);
            }
        }
        visitLiteralExpr(expr) {
            if (typeof expr.value === 'number')
                return ExprPrimaryType.Number;
            return ExprPrimaryType.Boolean;
        }
        visitBuiltInExpr(expr) {
            const builtIn = this.config.builtIns.get(expr.name.lexeme);
            for (let i = 0; i < expr.callArgs.length; i++) {
                const argType = this.getType(expr.callArgs[i]);
                const expected = builtIn.args[i];
                if (!this.doesTypeMatch(expected, argType)) {
                    this.errors.push(new ExprError(expr.name, `Error using '${expr.name.lexeme}'. Argument ${i} must be of type ${ExprPrimaryType[expected]}, but got ${ExprPrimaryType[argType]}`));
                }
            }
            return builtIn.returnType;
        }
        visitReferenceExpr(expr) {
            let refMap = this.config.references;
            for (let i = 0; i < expr.names.length - 1; i++) {
                refMap = refMap.children.get(expr.names[i].lexeme);
            }
            return refMap.properties.get(expr.names[expr.names.length - 1].lexeme);
        }
        visitGroupingExpr(expr) {
            return this.getType(expr.expression);
        }
        logOperatorError(operator, what, expected, got) {
            if (this.doesTypeMatch(expected, got))
                return;
            this.errors.push(new ExprError(operator, `Error using operator '${operator.lexeme}'. ${what} must be of type ${ExprPrimaryType[expected]}, but got ${ExprPrimaryType[got]}.`));
        }
        getCombinedTypes(typeA, typeB) {
            return typeA === typeB ? typeA : ExprPrimaryType.NumberBool;
        }
        doesTypeMatch(expected, got) {
            return expected === ExprPrimaryType.NumberBool || expected === got;
        }
    }
    class ExprBuilder {
        constructor(config) {
            this.config = config;
            this.errors = [];
            this.validator = new ExprValidator(this.config);
            this.typeChecker = new ExprTypeChecker(this.config);
        }
        test(exprString) {
            const {
                result,
                type,
                errors
            } = this.buildExpression(exprString);
            if (result === undefined) {
                errors.forEach((error) => console.log(`[Line ${error.line}] [Col: ${error.column}] ${error.message}`));
            } else {
                console.log(result);
                if (type !== undefined)
                    console.log(`Resolves to type: ${ExprPrimaryType[type]}`);
            }
        }
        /** Attempts to build an expression of the given type, throwing an error if it fails */
        buildWithType(exprString, desiredType, message) {
            const {
                result,
                type,
                errors
            } = this.buildExpression(exprString);
            if (result === undefined || type === undefined) {
                throw new Error(`${message}: ${errors.map((e) => `[Line ${e.line}] [Col: ${e.column}] ${e.message}`).join('\n')}`);
            } else if (type !== desiredType) {
                throw new Error(`${message}: Expression evaluates to ${ExprPrimaryType[type]}, but expected ${ExprPrimaryType[desiredType]}`);
            } else {
                return result;
            }
        }
        buildExpression(exprString) {
            this.errors = [];
            let parsedTokens;
            if (typeof exprString === 'string') {
                const scanner = new ExprScanner(exprString);
                const {
                    tokens,
                    errors
                } = scanner.scanTokens();
                parsedTokens = tokens;
                this.errors.push(...errors);
            } else {
                const source = exprString.toString();
                parsedTokens = [
                    new ExprToken(ExprTokenType.NUMBER, source, exprString, 0, 0),
                    new ExprToken(ExprTokenType.EOS, '', undefined, 0, source.length),
                ];
            }
            const parser = new ExprParser(parsedTokens);
            const {
                result,
                errors
            } = parser.parse();
            this.errors.push(...errors);
            if (this.errors.length > 0 || result === undefined)
                return {
                    errors: [...this.errors]
                };
            const validationErrors = this.validator.validateExpression(result);
            this.errors.push(...validationErrors);
            if (validationErrors.length > 0)
                return {
                    errors: [...this.errors]
                };
            const {
                type,
                errors: typeErrors
            } = this.typeChecker.getExpressionType(result);
            this.errors.push(...typeErrors);
            if (typeErrors.length > 0)
                return {
                    errors: [...this.errors]
                };
            return {
                result,
                type,
                errors: [...this.errors]
            };
        }
    }
    /** Base class for transpiling an expression string into a function object */
    class ExprTranspiler extends ExprBuilder {
        constructor(config, cache) {
            super(config);
            if (cache !== undefined)
                this.cache = cache;
            else
                this.cache = new Map();
        }
        buildFunction(exprString, message) {
            return this.buildFunctionExpr(exprString, message).func;
        }
        buildFunctionExpr(exprString, message) {
            const expr = this.buildWithType(exprString, this.returnType, message);
            const body = this.buildBody(expr);
            const cached = this.cache.get(body);
            if (cached !== undefined)
                return {
                    func: cached,
                    expr
                };
            const newFunction = new Function(...this.argNames, `return ${body};`);
            this.cache.set(body, newFunction);
            return {
                func: newFunction,
                expr
            };
        }
        buildBody(expr) {
            return expr.accept(this);
        }
        visitTernaryExpr(expr) {
            return `${this.buildBody(expr.condition)}?${this.buildBody(expr.left)}:${this.buildBody(expr.right)}`;
        }
        visitLogicalExpr(expr) {
            return `${this.buildBody(expr.left)}${expr.operator.lexeme}${this.buildBody(expr.right)}`;
        }
        visitBinaryExpr(expr) {
            const left = this.buildBody(expr.left);
            const right = this.buildBody(expr.right);
            switch (expr.operator.type) {
                case ExprTokenType.BANG_EQUAL:
                    return `${left}!==${right}`;
                case ExprTokenType.DOUBLE_EQUAL:
                    return `${left}===${right}`;
                case ExprTokenType.GREATER:
                case ExprTokenType.GREATER_EQUAL:
                case ExprTokenType.LESS:
                case ExprTokenType.LESS_EQUAL:
                case ExprTokenType.MINUS:
                case ExprTokenType.PLUS:
                case ExprTokenType.SLASH:
                case ExprTokenType.STAR:
                case ExprTokenType.PERCENT:
                    return `${left}${expr.operator.lexeme}${right}`;
                case ExprTokenType.CARET:
                    return `${left}**${right}`;
                default:
                    throw new Error('Unsupported Binary Operator.');
            }
        }
        visitUnaryExpr(expr) {
            return `${expr.operator}${this.buildBody(expr.right)}`;
        }
        visitLiteralExpr(expr) {
            return `${expr.value}`;
        }
        visitBuiltInExpr(expr) {
            const args = expr.callArgs.map((expr) => this.buildBody(expr));
            return this.getBuiltInBody(expr, args);
        }
        visitReferenceExpr(expr) {
            return this.getReferenceBody(expr);
        }
        visitGroupingExpr(expr) {
            return `(${this.buildBody(expr.expression)})`;
        }
        getStandardBuiltInBody(expr, args) {
            const allArgs = args.join(',');
            switch (expr.name.lexeme) {
                case 'floor':
                    return `Math.floor(${allArgs})`;
                case 'round':
                    return `Math.round(${allArgs})`;
                case 'ceil':
                    return `Math.ceil(${allArgs})`;
                case 'abs':
                    return `Math.abs(${allArgs})`;
                case 'min':
                    return `Math.min(${allArgs})`;
                case 'max':
                    return `Math.max(${allArgs})`;
                case 'clamp':
                    return `clampValue(${allArgs})`;
                case 'rand':
                    return `Math.random()`;
                case 'roll':
                    return `rollPercentage(${allArgs})`;
                default:
                    throw new Error('Unsupported Standard Function');
            }
        }
    }
    class CharacterNumberTranspiler extends ExprTranspiler {
        constructor() {
            super(...arguments);
            this.argNames = ['character'];
            this.returnType = ExprPrimaryType.Number;
        }
        getReferenceBody(expr) {
            const target = expr.names[0].lexeme === 'self' ? 'character' : 'character.target';
            return getCharacterReferenceBody(target, expr.names.slice(1));
        }
        getBuiltInBody(expr, args) {
            return this.getStandardBuiltInBody(expr, args);
        }
    }
    class CombatEffectNumberTranspiler extends ExprTranspiler {
        constructor() {
            super(...arguments);
            this.argNames = ['effect'];
            this.returnType = ExprPrimaryType.Number;
        }
        getReferenceBody(expr) {
            switch (expr.names[0].lexeme) {
                case 'hpMultiplier':
                    return `numberMultiplier`;
                case 'ignoreChance':
                    return ` effect.getIgnoreChance()`;
                case 'param':
                case 'p':
                    return `effect.getParameter('${expr.names[1].lexeme}')`;
                case 'statGroup':
                    return `effect.getStatGroup('${expr.names[1].lexeme}')`;
                case 'damage':
                case 'd':
                    return `effect.getDamage('${expr.names[1].lexeme}')`;
                case 'applicatorParam':
                    return `effect.getApplicatorParameter('${expr.names[1].lexeme}')`;
                case 'self':
                case 's':
                    return getCharacterReferenceBody('effect.character', expr.names.slice(1));
                case 'sourceCharacter':
                case 'sc':
                    return getCharacterReferenceBody('effect.sourceCharacter', expr.names.slice(1));
                case 'target':
                case 't':
                    return getCharacterReferenceBody('effect.character.target', expr.names.slice(1));
                default:
                    throw new Error('Unsupported Combat Effect Reference');
            }
        }
        getBuiltInBody(expr, args) {
            return this.getStandardBuiltInBody(expr, args);
        }
    }
    class InitialParamNumberTranspiler extends ExprTranspiler {
        constructor() {
            super(...arguments);
            this.argNames = ['initialParams'];
            this.returnType = ExprPrimaryType.Number;
        }
        getReferenceBody(expr) {
            return `initialParams.${expr.names[0].lexeme}`;
        }
        getBuiltInBody(expr, args) {
            return this.getStandardBuiltInBody(expr, args);
        }
    }
    class ModifierValueTranspiler extends ExprTranspiler {
        constructor() {
            super(...arguments);
            this.argNames = ['value'];
            this.returnType = ExprPrimaryType.Number;
        }
        getReferenceBody(expr) {
            switch (expr.names[0].lexeme) {
                case 'hpMultiplier':
                    return 'numberMultiplier';
                case 'value':
                    return 'value';
                default:
                    throw new Error('Unsupported Modifier Value Reference');
            }
        }
        getBuiltInBody(expr, args) {
            return this.getStandardBuiltInBody(expr, args);
        }
    }
    /** @deprecated Tree-walk intepreter for expressions. Use Transpilers instead for performance. */
    class ExprInterpreter {
        constructor(environment) {
            this.environment = environment;
        }
        evaluate(expr) {
            return expr.accept(this);
        }
        visitTernaryExpr(expr) {
            return this.evaluate(expr.condition) ? this.evaluate(expr.left) : this.evaluate(expr.right);
        }
        visitLogicalExpr(expr) {
            const left = this.evaluate(expr.left);
            switch (expr.operator.type) {
                case ExprTokenType.DOUBLE_PIPE:
                    return left || this.evaluate(expr.right);
                case ExprTokenType.DOUBLE_AMPERSAND:
                    return left && this.evaluate(expr.right);
                default:
                    throw new Error(`Interpreter does not support logical operator '${expr.operator.lexeme}'.`);
            }
        }
        visitBinaryExpr(expr) {
            const left = this.evaluate(expr.left);
            const right = this.evaluate(expr.right);
            switch (expr.operator.type) {
                case ExprTokenType.BANG_EQUAL:
                    return left !== right;
                case ExprTokenType.DOUBLE_EQUAL:
                    return left === right;
                case ExprTokenType.GREATER:
                    return left > right;
                case ExprTokenType.GREATER_EQUAL:
                    return left >= right;
                case ExprTokenType.LESS:
                    return left < right;
                case ExprTokenType.LESS_EQUAL:
                    return left <= right;
                case ExprTokenType.MINUS:
                    return left - right;
                case ExprTokenType.PLUS:
                    return left + right;
                case ExprTokenType.SLASH:
                    return left / right;
                case ExprTokenType.STAR:
                    return left * right;
                case ExprTokenType.CARET:
                    return Math.pow(left, right);
                case ExprTokenType.PERCENT:
                    return left % right;
                default:
                    throw new Error(`Interpreter does not support binary operator '${expr.operator.lexeme}'.`);
            }
        }
        visitUnaryExpr(expr) {
            const right = this.evaluate(expr);
            switch (expr.operator.type) {
                case ExprTokenType.BANG:
                    return !right;
                case ExprTokenType.MINUS:
                    return -right;
                default:
                    throw new Error(`Interpreter does not support unary operator '${expr.operator.lexeme}'.`);
            }
        }
        visitLiteralExpr(expr) {
            return expr.value;
        }
        visitBuiltInExpr(expr) {
            return this.environment.callBuiltin(expr.name.lexeme, expr.callArgs.map((arg) => this.evaluate(arg)));
        }
        visitReferenceExpr(expr) {
            return this.environment.getReference(expr);
        }
        visitGroupingExpr(expr) {
            return this.evaluate(expr.expression);
        }
    }
    const standardBuiltIns = [{
            name: 'floor',
            args: [ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'round',
            args: [ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'ceil',
            args: [ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'abs',
            args: [ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'min',
            args: [ExprPrimaryType.Number, ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'max',
            args: [ExprPrimaryType.Number, ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'clamp',
            args: [ExprPrimaryType.Number, ExprPrimaryType.Number, ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'rand',
            args: [],
            returnType: ExprPrimaryType.Number,
        },
        {
            name: 'roll',
            args: [ExprPrimaryType.Number],
            returnType: ExprPrimaryType.Boolean,
        },
    ];
    const evasionsNode = new ExprReferenceNode();
    evasionsNode.addProperties(['melee', 'ranged', 'magic'], ExprPrimaryType.Number);
    const statsNode = new ExprReferenceNode();
    statsNode.addProperties([
        'minHit',
        'maxHit',
        'accuracy',
        'maxHitpoints',
        'attackInterval',
        'maxBarrier',
        'damageReduction',
        'averageEvasion',
        'maxEvasion',
    ], ExprPrimaryType.Number);
    statsNode.addChild('evasion', evasionsNode);
    const equipStatsNode = new ExprReferenceNode();
    equipStatsNode.addProperties([
        'attackSpeed',
        'stabAttackBonus',
        'slashAttackBonus',
        'blockAttackBonus',
        'rangedAttackBonus',
        'magicAttackBonus',
        'meleeStrengthBonus',
        'rangedStrengthBonus',
        'magicDamageBonus',
        'meleeDefenceBonus',
        'rangedDefenceBonus',
        'magicDefenceBonus',
        'damageReduction',
    ], ExprPrimaryType.Number);
    const levelsNode = new ExprReferenceNode();
    const abyssalLevelsNode = new ExprReferenceNode();
    levelsNode.addProperties(['Hitpoints', 'Attack', 'Strength', 'Defence', 'Ranged', 'Magic', 'Prayer', 'Corruption'], ExprPrimaryType.Number);
    abyssalLevelsNode.addProperties(['Hitpoints', 'Attack', 'Strength', 'Defence', 'Ranged', 'Magic', 'Prayer', 'Corruption'], ExprPrimaryType.Number);
    const modifierNode = new ExprReferenceNode();
    /** Updates the modifiers available to the character expression builder */
    function updateModifiers(namespace, modifiers) {
        const keys = [];
        modifiers.forEach((modifier) => {
            if (!modifier.hasEmptyScope || !modifier.allowEnemy)
                return;
            keys.push(modifier.localID);
        });
        if (namespace.isModded) {
            let moddedNode = modifierNode.children.get(namespace.name);
            if (moddedNode === undefined) {
                moddedNode = new ExprReferenceNode();
                modifierNode.addChild(namespace.name, moddedNode);
            }
            moddedNode.addProperties(keys, ExprPrimaryType.Number);
        } else {
            modifierNode.addProperties(keys, ExprPrimaryType.Number);
        }
    }
    let characterNode;

    function getCharacterNode() {
        if (characterNode === undefined) {
            characterNode = new ExprReferenceNode();
            characterNode.addProperties(['hitpoints'], ExprPrimaryType.Number);
            characterNode.addProperties(['isBoss'], ExprPrimaryType.Boolean);
            characterNode.addChild('modifier', modifierNode);
            characterNode.addChild('stats', statsNode);
            characterNode.addChild('equipStats', equipStatsNode);
            characterNode.addChild('levels', levelsNode);
            characterNode.addChild('abyssalLevels', abyssalLevelsNode);
        }
        return characterNode;
    }
    let characterExprConfig;

    function getCharacterExprConfig() {
        if (characterExprConfig === undefined) {
            const refNode = new ExprReferenceNode();
            refNode.addProperties(['hpMultiplier'], ExprPrimaryType.Number);
            const characterNode = getCharacterNode();
            refNode.addChild('self', characterNode);
            refNode.addChild('target', characterNode);
            characterExprConfig = new ExprConfig(standardBuiltIns, refNode);
        }
        return characterExprConfig;
    }

    function getCombatEffectExprConfig(namedProps) {
        const paramNode = new ExprReferenceNode();
        paramNode.addProperties(namedProps.parameters, ExprPrimaryType.Number);
        const statGroupNode = new ExprReferenceNode();
        statGroupNode.addProperties(namedProps.statGroups, ExprPrimaryType.Number);
        const damageNode = new ExprReferenceNode();
        damageNode.addProperties(namedProps.damageGroups, ExprPrimaryType.Number);
        const characterNode = getCharacterNode();
        const refNode = new ExprReferenceNode();
        refNode.addProperties(['hpMultiplier', 'ignoreChance'], ExprPrimaryType.Number);
        refNode.addChild('param', paramNode);
        refNode.addChild('p', paramNode);
        refNode.addChild('applicatorParam', paramNode);
        refNode.addChild('statGroup', statGroupNode);
        refNode.addChild('damage', damageNode);
        refNode.addChild('d', damageNode);
        refNode.addChild('self', characterNode);
        refNode.addChild('s', characterNode);
        refNode.addChild('target', characterNode);
        refNode.addChild('t', characterNode);
        refNode.addChild('sourceCharacter', characterNode);
        refNode.addChild('sc', characterNode);
        return new ExprConfig(standardBuiltIns, refNode);
    }

    function getInitialParamConfig(paramNames) {
        const refNode = new ExprReferenceNode();
        refNode.addProperties(paramNames, ExprPrimaryType.Number);
        return new ExprConfig(standardBuiltIns, refNode);
    }
    let charExprBuilder;

    function getCharacterNumberTranspiler() {
        if (charExprBuilder === undefined)
            charExprBuilder = new CharacterNumberTranspiler(getCharacterExprConfig());
        return charExprBuilder;
    }
    const combatEffectCache = new Map();

    function getCombatEffectNumberTranspiler(effect) {
        const config = getCombatEffectExprConfig({
            parameters: Object.keys(effect.parameters),
            statGroups: Object.keys(effect.statGroups),
            timers: [],
            damageGroups: Object.keys(effect.damageGroups),
        });
        return new CombatEffectNumberTranspiler(config, combatEffectCache);
    }
    const initialParamCache = new Map();

    function getInitialParamNumberTranspiler(paramNames) {
        return new InitialParamNumberTranspiler(getInitialParamConfig(paramNames), initialParamCache);
    }
    let modifierValueTranspiler;

    function getModifierValueTranspiler() {
        if (modifierValueTranspiler === undefined) {
            const refNode = new ExprReferenceNode();
            refNode.addProperties(['hpMultiplier', 'value'], ExprPrimaryType.Number);
            modifierValueTranspiler = new ModifierValueTranspiler(new ExprConfig(standardBuiltIns, refNode));
        }
        return modifierValueTranspiler;
    }

    function getCharacterReferenceBody(instanceName, names) {
        switch (names[0].lexeme) {
            case 'hpMultiplier':
                return `numberMultiplier`;
            case 'hitpoints':
                return `${instanceName}.hitpoints`;
            case 'isBoss':
                return `${instanceName}.isBoss`;
            case 'modifier':
                if (names.length > 2) {
                    return `${instanceName}.modifiers.getValue("${names[1].lexeme}:${names[2].lexeme}", ModifierQuery.EMPTY)`;
                } else {
                    return `${instanceName}.modifiers.${names[1].lexeme}`;
                }
            case 'stats':
                if (names.length > 2) {
                    return `${instanceName}.stats.evasion.${names[2].lexeme}`;
                } else {
                    return `${instanceName}.stats.${names[1].lexeme}`;
                }
            case 'equipStats':
                return `${instanceName}.equipmentStats.${names[1].lexeme}`;
            case 'levels':
                return `${instanceName}.levels.${names[1].lexeme}`;
            case 'abyssalLevels':
                return `${instanceName}.abyssalLevels.${names[1].lexeme}`;
            default:
                throw new Error(`Unsupported Character Reference: "${names[0].lexeme}"`);
        }
    }
    class ExprComparer {
        compareExpressions(exprA, exprB) {
            try {
                this.compare(exprA, exprB);
                return true;
            } catch (_a) {
                return false;
            }
        }
        compare(exprA, exprB) {
            this.exprB = exprB;
            return exprA.accept(this);
        }
        visitTernaryExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof TernaryExpr))
                throw '';
            this.compare(exprA.condition, exprB.condition);
            this.compare(exprA.left, exprB.right);
            this.compare(exprA.left, exprB.right);
        }
        visitLogicalExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof LogicalExpr) || exprA.operator.lexeme !== exprB.operator.lexeme)
                throw '';
            this.compare(exprA.left, exprB.left);
            this.compare(exprA.right, exprB.right);
        }
        visitBinaryExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof BinaryExpr) || exprA.operator.lexeme !== exprB.operator.lexeme)
                throw '';
            this.compare(exprA.left, exprB.left);
            this.compare(exprA.right, exprB.right);
        }
        visitUnaryExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof UnaryExpr) || exprA.operator.lexeme !== exprB.operator.lexeme)
                throw '';
            this.compare(exprA.right, exprB.right);
        }
        visitLiteralExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof LiteralExpr) || exprA.value !== exprB.value)
                throw '';
        }
        visitBuiltInExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof BuiltInExpr) ||
                exprA.name.lexeme !== exprB.name.lexeme ||
                exprA.callArgs.length !== exprB.callArgs.length)
                throw '';
            exprA.callArgs.forEach((argA, i) => {
                this.compare(argA, exprB.callArgs[i]);
            });
        }
        visitReferenceExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof ReferenceExpr) ||
                exprA.names.length !== exprB.names.length ||
                exprA.names.some((name, i) => exprB.names[i].lexeme !== name.lexeme))
                throw '';
        }
        visitGroupingExpr(exprA) {
            const exprB = this.exprB;
            if (!(exprB instanceof GroupingExpr))
                throw '';
            this.compare(exprA.expression, exprB.expression);
        }
    }
    const comparer = new ExprComparer();
    /** Checks if two expressions would compute the same thing (roughly) */
    function compare(a, b) {
        if (a === b)
            return true;
        return comparer.compareExpressions(a, b);
    }
    class ExprTester extends ExprBuilder {
        validateWithType(exprString, desiredType) {
            const {
                result,
                type,
                errors
            } = this.buildExpression(exprString);
            if (result === undefined || type === undefined) {
                return {
                    isValid: false,
                    isLiteral: false,
                    errors,
                };
            } else if (type !== desiredType) {
                return {
                    isValid: false,
                    isLiteral: result instanceof LiteralExpr,
                    errors: [
                        new ExprError({
                            line: 0,
                            column: 0
                        }, `Expression evaluates to ${ExprPrimaryType[type]}, but expected ${ExprPrimaryType[desiredType]}`),
                    ],
                };
            } else {
                return {
                    isValid: true,
                    isLiteral: result instanceof LiteralExpr,
                    errors: [],
                };
            }
        }
    }
    let characterExprTester;

    function getCharacterExprTester() {
        if (characterExprTester === undefined) {
            const tester = new ExprTester(getCharacterExprConfig());
            characterExprTester = (exprString, type) => tester.validateWithType(exprString, type);
        }
        return characterExprTester;
    }

    function getCombatEffectExprTester(namedProps) {
        const tester = new ExprTester(getCombatEffectExprConfig(namedProps));
        return (exprString, type) => tester.validateWithType(exprString, type);
    }

    function getInitialParamExprTester(namedProps) {
        const tester = new ExprTester(getInitialParamConfig(namedProps.parameters));
        return (exprString, type) => tester.validateWithType(exprString, type);
    }
    return {
        updateModifiers,
        getCharacterNumberTranspiler,
        getCombatEffectNumberTranspiler,
        getInitialParamNumberTranspiler,
        getModifierValueTranspiler,
        getCharacterExprTester,
        getCombatEffectExprTester,
        getInitialParamExprTester,
    };
})();
//# sourceMappingURL=expressionBuilder.js.map
checkFileVersion('?12097')