# pegjs

- [Commonly used expressions](#commonly-used-expressions)
  * [标点](#%E6%A0%87%E7%82%B9)
  * [运算符](#%E8%BF%90%E7%AE%97%E7%AC%A6)
  * [注释](#%E6%B3%A8%E9%87%8A)
  * [数字](#%E6%95%B0%E5%AD%97)
  * [标志符](#%E6%A0%87%E5%BF%97%E7%AC%A6)
- [Built-in Functions](#built-in-functions)
- [Tips](#tips)
- [References](#references)

---

# Commonly used expressions

## 标点

```tsx
// Punctuation

LBRACE = "{"
RBRACE = "}"
LBRACKET = "["
RBRACKET = "]"
LPAREN = "("
RPAREN = ")"
EQUAL = "="
PERIOD = "."
DOLLAR = "$"
COMMA = ","
_ = (WhiteSpace / LineTerminatorSequence / Comment)*
__ = (WhiteSpace / MultiLineCommentNoLineTerminator)+
WhiteSpace "whitespace" = [ \t\n\r]
```

## 运算符

```tsx
// Operators

PLUS = "+"
MINUS = "-"
ASTERISK = "*"
SLASH = "/"
```

## 注释

```tsx
// ============================= Comments ======================================
// From https://github.com/pegjs/pegjs/blob/master/examples/javascript.pegjs

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminator) SourceCharacter)* "*/"

SingleLineComment
  = "//" (!LineTerminator SourceCharacter)*

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028"
  / "\u2029"

SourceCharacter
  = .
```

## 数字

```plain
Number "number"
  = minus? int frac? exp? { return parseFloat(text()); }


decimal_point
  = "."


digit1_9
  = [1-9]


e
  = [eE]


exp
  = e (minus / plus)? DIGIT+


frac
  = decimal_point DIGIT+


int
  = zero / (digit1_9 DIGIT*)


minus
  = "-"


plus
  = "+"


zero
  = "0"


DIGIT  = [0-9]


HEXDIG = [0-9a-f]i
```

## 标志符

```tsx
Identifier "identifier"
  = [a-zA-Z_][a-zA-Z0-9-_]*"'"*
    { return { kind: "identifier", text: text() }; }
```

# Built-in Functions

<font style="color:rgb(0, 0, 0);">The code inside the action can also access the text matched by the expression using the </font><code><font style="color:rgb(0, 0, 0);">text</font></code><font style="color:rgb(0, 0, 0);"> function.</font>

<font style="color:rgb(0, 0, 0);">The code inside the action can also access location information using the </font><code><font style="color:rgb(0, 0, 0);">location</font></code><font style="color:rgb(0, 0, 0);"> function. It returns an object like this:</font>

<font style="color:rgb(0, 0, 0);">To indicate an error, the code inside the action can invoke the </font><code><font style="color:rgb(0, 0, 0);">expected</font></code><font style="color:rgb(0, 0, 0);"> function</font>

# Tips

所有expressions之前的大括号括起来的区域为initializer。

# References

* <https://pegjs.org/documentation#generating-a-parser>
* <https://github.com/pegjs/pegjs/blob/master/examples/javascript.pegjs>


> 更新: 2023-04-27 15:44:37  
> 原文: <https://www.yuque.com/viruspc/el3mi0/mbimqcgqyhmz6d71>