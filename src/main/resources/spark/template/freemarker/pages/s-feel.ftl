<div class="page-header">
    <h1>Introduction</h1>
</div>

<p>Simple Friendly Enough Expression Language (S-FEEL) is described by DMN.
    This Section will show you how S-FEEL Expressions get translated to RuleML or Prova.
    Please choose a language:</p>
<div class="btn-group btn-group-justified" aria-label="panel-serialization">
    <div class="btn-group" role="group">
        <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML</button>
    </div>
    <div class="btn-group" role="group">
        <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
    </div>
</div>

<p>FEEL Expression can used as assigning or comparison.</p>

<div class="btn-group btn-group-justified s-feel-btn-group" data-toggle="buttons">
    <div class="btn-group" role="group">
        <label class="btn btn-primary active">
            <input type="radio" name="options" id="option1" value="assign" autocomplete="off" checked>
            Assigning a value e.g. $X := 20 \cdot a$
        </label>
    </div>
    <div class="btn-group" role="group">
        <label class="btn btn-primary">
            <input type="radio" name="options" id="option2" value="compare" autocomplete="off">
            Comparing a value e.g. $X = \frac{a}{2}$.
        </label>
    </div>
</div>

<p>&nbsp;</p>


<div class="row">
    <div class="col-md-6">
        <textarea class="s-feel-code">7 * a / 20 - c</textarea>
        <div id="s-feel-code-math-jax">$$ X := 7 \cdot a / 20 - c $$</div>
        <button class="btn btn-default btn-translate">Translate</button>
    </div>
    <div class="col-md-6">
        <?prettify lang=xml linenums=false?>
        <pre class="prettyprint pp-ruleml sfeel-ruleml-translation"></pre>
        <pre class="pp-prova sfeel-ruleml-translation-prova" style="display:none;"></pre>
    </div>
</div>


<article id="ExpressionLanguagePrimitives">
    <div class="page-header">
        <h1>Primitives Data Types</h1>
    </div>

    <section id="SFeelSimpleLiteral">
        <h3>Simple Literal
            <small>Rule number 33</small>
        </h3>

        <div class="row">
            <div class="col-md-12">
                <pre>simpleLiteral: <a href="#SFeelBooleanLiteral">BooleanLiteral</a> | <a href="#SFeelNumericLiteral">NumericLiteral</a> | <a
                        href="#SFeelStringLiteral">StringLiteral</a> | <a
                        href="#SFeelDateTimeLiteral">DateTimeLiteral</a>;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelStringLiteral">
        <h3>String Literal
            <small>Rule number 34</small>
        </h3>
        <div class="row">
            <div class="col-md-offset-1 col-md-11">
                <b>S-FEEL grammar rule:</b>
                <pre>string literal = '"' , { character – ('"' | vertical space) }, '"' ;</pre>
                <b>RuleML serialization example:</b>
                <?prettify lang=xml linenums=true?>
                <pre class="prettyprint linenums">&lt;Data xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns:xs=&quot;http://www.w3.org/2001/XMLSchema&quot; xsi:type=&quot;xs:string&quot;&gt;Summer&lt;/Data&gt;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelBooleanLiteral">
        <h3>Boolean Literal
            <small>Rule number 35</small>
        </h3>
        <div class="row">
            <div class="col-md-offset-1 col-md-11">
                <b>S-FEEL grammar rule:</b>
                <pre>Boolean literal = "true" | "false" ;</pre>
                <b>RuleML serialization example:</b>
                <pre class="prettyprint linenums">&lt;Data xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns:xs=&quot;http://www.w3.org/2001/XMLSchema&quot; xsi:type=&quot;xs:boolean&quot;&gt;true&lt;/Data&gt;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelNumericLiteral">
        <h3>Numeric Literal
            <small>Rule numbers 36, 37, 38</small>
        </h3>
        <div class="row">
            <div class="col-md-offset-1 col-md-11">
                <b>S-FEEL grammar rule:</b>
                <pre>numeric literal = [ "-" ] , ( digits , [ ".", digits ] | "." , digits ) ;
digit = [0-9] ;
digits = digit , {digit} ;</pre>
                <b>RuleML serialization example:</b>
                <pre class="prettyprint linenums">&lt;Data xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot; xmlns:xs=&quot;http://www.w3.org/2001/XMLSchema&quot; xsi:type=&quot;xs:double&quot;&gt;3.14&lt;/Data&gt;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelDateTimeLiteral">
        <h3>Date Time Literal
            <small>Rule number 39</small>
        </h3>
        <div class="row">
            <div class="col-md-offset-1 col-md-11">
                <p>This literal type is currently not supported.</p>
                <b>S-FEEL grammar rule:</b>
                <pre>date time literal = ("date" | "time" | "duration" ) , "(" , string literal , ")" ;</pre>
            </div>
        </div>
    </section>
</article>


<article id="ExpressionLanguageS-FEEL">
    <div class="page-header">
        <h1>S-FEEL</h1>
    </div>


    <section id="SFeelSimpleExpressions">
        <h3>Simple Expressions
            <small>Rule number 6</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>simpleExpressions: (<a href="#SFeelSimpleExpression">simpleExpression</a> ','?)+ | <a
                        href="#SFeelSimpleExpression">simpleExpression</a>;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelSimpleExpression">
        <h3>Simple Expression
            <small>Rule number 5</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>simpleExpression: <a href="#SFeelArithmetic">arithmetic</a> | <a href="#SFeelSimpleUnaryTests">simpleUnaryTests</a> | <a
                        href="#SFeelSimpleValue">simpleValue</a>;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelSimpleValue">
        <h3>Simple Value
            <small>Rule number 19</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>simpleValue: <a href="#SFeelSimpleLiteral">simpleLiteral</a> | <a href="#SFeelQualifiedName">qualifiedName</a>;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelQualifiedName">
        <h3>Qualified Name
            <small>Rule number 20</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>qualifiedName: ( '.'? Name )+;
Name: NameStartChar (NamePartChar+ | AdditionalNameSymbols)*;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelEndpoint">
        <h3>Endpoint
            <small>Rule number 18</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>endpoint: <a href="#SFeelSimpleValue">simpleValue</a>;</pre>
            </div>
        </div>
    </section>

    <section id="SFeelArithmetic">
        <h3>Arithmetic
            <small>Rule number 4</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule</b>
          <pre>arithmetic
: &lt;assoc=right&gt; simpleExpression ^ simpleExpression
| simpleExpression / simpleExpression
| simpleExpression * simpleExpression
| simpleExpression + simpleExpression
| simpleExpression - simpleExpression
| - simpleExpression
;</pre>

                <div class="btn-group btn-group-justified s-feel-btn-group s-feel-btn-group-arithmetic"
                     data-toggle="buttons">
                    <div class="btn-group" role="group">
                        <label class="btn btn-primary active">
                            <input type="radio" name="arithmetic" id="arithmeticAddition" value="1 + 3"
                                   autocomplete="off" checked>
                            Addition
                        </label>
                    </div>
                    <div class="btn-group" role="group">
                        <label class="btn btn-primary">
                            <input type="radio" name="arithmetic" id="arithmeticSubtraction" value="3 - 4"
                                   autocomplete="off">
                            Subtraction
                        </label>
                    </div>
                    <div class="btn-group" role="group">
                        <label class="btn btn-primary">
                            <input type="radio" name="arithmetic" id="arithmeticMultiplication" value="12.4 * 1.19"
                                   autocomplete="off">
                            Multiplication
                        </label>
                    </div>
                    <div class="btn-group" role="group">
                        <label class="btn btn-primary">
                            <input type="radio" name="arithmetic" id="arithmeticDivision" value="4 / 5"
                                   autocomplete="off">
                            Division
                        </label>
                    </div>
                    <div class="btn-group" role="group">
                        <label class="btn btn-primary">
                            <input type="radio" name="arithmetic" id="arithmeticExponentiation" value="2^6"
                                   autocomplete="off">
                            Exponentiation
                        </label>
                    </div>
                </div>
                <div id="s-feel-rule-arithmetic-example"><b>RuleML Translation $ 1 + 3 $ example</b>:</div>
                <pre class="prettyprint linenums pp-ruleml s-feel-pp-arithmetic"></pre>
                <pre class="pp-prova s-feel-pp-arithmetic-prova" style="display:none;"></pre>
            </div>


        </div>
    </section>

    <section id="SFeelSimpleUnaryTests">
        <h3>Simple Unary Tests
            <small>Rule number 14</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>simpleUnaryTests: <a
                        href="#SFeelSimplePositiveUnaryTests">simplePositiveUnaryTests</a> | NOT '(' <a
                        href="#SFeelSimplePositiveUnaryTests">simplePositiveUnaryTests</a> ')' | '-';</pre>
            </div>
        </div>
    </section>

    <section id="SFeelSimplePositiveUnaryTests">
        <h3>Simple Positive Unary Tests
            <small>Rule number 13</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>simplePositiveUnaryTests: (<a
                        href="#SimplePositiveUnaryTest">simplePositiveUnaryTest</a> ','?)+;</pre>
            </div>
        </div>
    </section>

    <section id="SimplePositiveUnaryTest">
        <h3>Simple Positive Unary Test
            <small>Rule number 7</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>simplePositiveUnaryTest: (< | <= | > | >=) <a href="#SFeelEndpoint">endpoint</a> | <a
                        href="#SFeelInterval">interval</a>;</pre>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div class="input-group">
                    <div class="input-group-btn">
                        <button type="button" class="btn btn-default btn-unary-test" value="<">&lt;</button>
                        <button type="button" class="btn btn-default btn-unary-test" value="<=">$\leq$</button>
                        <button type="button" class="btn btn-default btn-unary-test" value=">">&gt;</button>
                        <button type="button" class="btn btn-default btn-unary-test active" value=">=">$\geq$</button>
                    </div>

                    <input type="text" class="form-control unary-test" value="12">

                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div id="s-feel-unary-test-example"><b>RuleML Translation $ \geq 12 $ example</b>:</div>
                <?prettify lang=xml linenums=true?>
                <pre class="prettyprint linenums pp-ruleml s-feel-unary-test"></pre>
                <pre class="pp-prova s-feel-unary-test-prova" style="display:none;"></pre>
            </div>
        </div>
    </section>

    <section id="SFeelInterval">
        <h3>Interval
            <small>Rule numbers 8, 9, 10 , 11, 12</small>
        </h3>
        <div class="row">
            <div class="col-md-12">
                <b>S-FEEL grammar rule:</b>
                <pre>interval: (openIntervalStart | closedIntervalStart ) <a href="#SFeelEndpoint">endpoint</a> '..' <a
                        href="#SFeelEndpoint">endpoint</a> (openIntervalEnd | closedIntervalEnd );
openIntervalStart: '(' | ']';
closedIntervalStart: '[';
openIntervalEnd: ')' | '[';
closedIntervalEnd: ']';</pre>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div class="input-group">
                    <div class="input-group-btn">
                        <button type="button" class="btn btn-default btn-interval btn-interval-start" value="(">(
                        </button>
                        <button type="button" class="btn btn-default btn-interval btn-interval-start active" value="[">
                            [
                        </button>
                    </div>

                    <input type="text" class="form-control interval-start" value="5" aria-label="...">
                    <div class="input-group-addon">..</div>
                    <input type="text" class="form-control interval-end" value="17" aria-label="...">

                    <div class="input-group-btn">
                        <button type="button" class="btn btn-default btn-interval btn-interval-end active" value="]">]
                        </button>
                        <button type="button" class="btn btn-default btn-interval btn-interval-end" value=")">)</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <div id="s-feel-interval-example"><b>RuleML Translation $ [ 5 .. 17 ] $ example</b>:</div>
                <?prettify lang=xml linenums=true?>
                <pre class="prettyprint linenums pp-ruleml s-feel-interval"></pre>
                <pre class="pp-prova s-feel-interval-prova"></pre>
            </div>
        </div>
    </section>

</article>

<script src="js/sfeel-init.js"></script>