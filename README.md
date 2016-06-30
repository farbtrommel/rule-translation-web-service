# Rule Translation Web Service (RTWS)

RTWS build the bridge between the [Rule Translation Service](https://github.com/farbtrommel/rule-translation-service) and a [REST Service](https://de.wikipedia.org/wiki/Representational_State_Transfer). 
Additionally to RTS is RTWS capable to execute a [Prova](http://www.prova.ws) file and returns the queries results as [JSON Object](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/JSON). 

## Run RTWS as Heroku App

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Running Locally

Make sure you have Java and Maven installed. Also, install the [Heroku Toolbelt](https://toolbelt.heroku.com/).

```sh
$ git clone https://github.com/farbtrommel/rule-translation-web-service rtws
$ cd rtws
$ mvn install
$ heroku local:start
//or for windows: 
$ heroku local:start -f Procfile.windows
```

The app should now be running on [localhost:5050](http://localhost:5050/).

## REST API

| Method + URL            | Body data of request | Body data of response |
| ------------- | ------------- | ------------- |
| GET  /api/from-ruleml/  | -  | List of all available languages from RuleML |
| GET  /api/to-ruleml/  | -  | List of all available languages to RuleML |
| POST /api/translate/:in/:out/  | The body of the request message contains a file from type :in language | The body of the response message contains a result file from :out language |
| POST /api/execute/  |  ```{parameters: [{key: value}], language: "dmn", source: dmnDecisionTableXml}``` | ProvaSolution as JSON Object |
| POST /api/execute/file  | see cell above  | Prova source code as plain text |

## Demo

The App contains a demo site. The demo site is about [DMN](http://www.omg.org/spec/DMN/) decision table and S-FEEL (expression language from DMN). 
Demo shows how a decision table and S-FEEL expression will be translated to [RuleML](http://wiki.ruleml.org/) or Prova.
Last but not least the app execute a sample decision. Run the app for further information.


