"use strict";
// Auto-generated on 2024-02-13T06:02:02.723Z
class Expr {}
class TernaryExpr extends Expr {
    constructor(condition, operator, left, right) {
        super();
        this.condition = condition;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitTernaryExpr(this);
    }
}
class LogicalExpr extends Expr {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitLogicalExpr(this);
    }
}
class BinaryExpr extends Expr {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitBinaryExpr(this);
    }
}
class UnaryExpr extends Expr {
    constructor(operator, right) {
        super();
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitUnaryExpr(this);
    }
}
class LiteralExpr extends Expr {
    constructor(value) {
        super();
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitLiteralExpr(this);
    }
}
class BuiltInExpr extends Expr {
    constructor(name, paren, callArgs) {
        super();
        this.name = name;
        this.paren = paren;
        this.callArgs = callArgs;
    }
    accept(visitor) {
        return visitor.visitBuiltInExpr(this);
    }
}
class ReferenceExpr extends Expr {
    constructor(names) {
        super();
        this.names = names;
    }
    accept(visitor) {
        return visitor.visitReferenceExpr(this);
    }
}
class GroupingExpr extends Expr {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitGroupingExpr(this);
    }
}
//# sourceMappingURL=expressionAST.js.map
checkFileVersion('?12097')