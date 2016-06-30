<div class="page-header">
    <h1>Introduction</h1>
</div>

<p>There are three ways to translate
    <a href="#cli">command-line interface</a>,
    <a href="#jar">Java library</a> or
    <a href="#api">REST API</a>. The next section show how to translate in each possible case.
    We assume for the samples there is a file "table.dmn".
    The file "table.dmn" contains a valid DMN Decision Table serialization.</p>

<div class="alert alert-info">Download jar with dependencies <a
        href="/repo/de/farbtrommel/rts/${rtsversion}/rts-${rtsversion}.jar" target="_blank">here</a>.
</div>

<article id="cli">
    <div class="page-header">
        <h1>Command-Line Interface</h1>
    </div>
    <div class="row">
        <div class="col-md-12">
            <b>Translation:</b><br/>
            The command to translate "table.dmn" file to ruleml:
            <pre>$&gt; java -jar rts-${rtsversion}.jar dmn ruleml table.dmn</pre>
            or
            <pre>$&gt; java -jar rts-${rtsversion}.jar dmn ruleml table.dmn table.ruleml</pre>
            to store output to file "table.ruleml".
            <br/>
            <p><b>List supported operations:</b></p>
            <pre>$&gt; java -jar rts-${rtsversion}.jar list</pre>
        </div>
    </div>
</article>

<article id="jar">
    <div class="page-header">
        <h1>Java API</h1>
    </div>

    <div class="row">
        <div class="col-md-12">
            <p><b>Maven:</b></p>
            <pre>&lt;repositories&gt;
      &lt;!--other repositories if any--&gt;
      &lt;repository&gt;
          &lt;id&gt;de.farbtrommel&lt;/id&gt;
          &lt;name&gt;rts&lt;/name&gt;
          &lt;url&gt;http://${host}/repo&lt;/url&gt;
      &lt;/repository&gt;
  &lt;/repositories&gt;</pre>
            <pre>&lt;dependency&gt;
  &lt;groupId&gt;de.farbtrommel&lt;/groupId&gt;
  &lt;artifactId&gt;rts&lt;/artifactId&gt;
  &lt;version&gt;${rtsversion}&lt;/version&gt;
&lt;/dependency&gt;</pre>
            <p><b>Translation:</b></p>
            The code to translate "table.dmn" file to RuleML and store to file "table.ruleml":

            <pre class="prettyprint">//...
public static void main(String[] args) {
    RuleTranslationService rts = RuleTranslationServiceFactory.createRuleTranslationService();

    try {
        rts.translate(new File("table.dmn"), "DMN", "RuleML", new FileOutputStream("table.ruleml"));
    } catch (UnknownRulesLanguageException ex) {
        // ...
    } catch (RuleTranslationException ex) {
        // ...
    }
}
// ...
            </pre>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12">
            <p><b>Retrieve supported languages</b>.</p>
            <p>Note, translation will be always from or to RuleML.</p>
            <p>We assume ruleTranslatorService is initialized as in example above.</p>
        </div>
    </div>
    <div class="row">
        <div class="col-md-offset-1 col-md-11">
            <p><b>To Rule</b>:</p>
            <pre class="prettyprint">Set<RuleLanguage> toRule = ruleTranslationService.getSupportedLanguagesToRuleML();</pre>
            <p><b>From Rule</b>:</p>
            <pre class="prettyprint">Set<RuleLanguage> fromRule = ruleTranslationService.getSupportedLanguagesFromRuleML();</pre>
        </div>
    </div>
</article>

<article id="api">
    <div class="page-header">
        <h1>RESTful API</h1>
    </div>
    <div class="row">
        <div class="col-md-12">
            <p><b>Translation</b>:</p>
            <p>Translate the DMN file call the URL</p>
            <pre>POST http://${host}/api/translate/dmn/ruleml/ &lt; dmn-file-content &gt;</pre>
            <p>with the payload load with the file "table.dmn" content.
                The response will be in the payload and the content type is set in this example to application/xml</p>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <p><b>Retrieve supported languages</b>.</p>
            <p>Note, translation will be always from or to RuleML.</p>
        </div>
    </div>

    <div class="row">
        <div class="col-md-offset-1 col-md-11">
            <p><b>To Rule</b>:</p>
            <pre>GET http://${host}/api/to-ruleml/</pre>
            <p><b>From Rule</b>:</p>
            <pre>GET http://${host}/api/from-ruleml/</pre>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <p><b>Execution</b>:</p>
            <p>Execute the DMN by calling the URL</p>
            <pre>POST http://${host}/api/execute/ Payload: {language: "dmn", source: &lt; dmn-file-content &gt;, query: ["inputEntry(_,_,_)"]}</pre>
            <p>with a json object as payload.
                The response will be a json object array: 1. result of decision table, 2. all true output entries and 3.
                all true input entries. </p>
        </div>
    </div>


</article>