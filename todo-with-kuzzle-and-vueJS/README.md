# Todo MVC Step1

## Requirements
Vue Cli 3

Kuzzle 

Kuzzle SDK JS 6

## Suggestion
Dans ce how-to, nous avons utilisé Vuetify pour nos templates ainsi que Izitoast pour nos notifications.

## Introduction
Kuzzle permet de gerer de nombreuses données de manière très simple.

Dans ce How-to, nous allons vous montrer comment réaliser une simple todoMVC en utilisant Kuzzle et VueJS.

Cette première partie mettra en avant les fonctionnalitées de bases de Kuzzle telles que:
- La connexion a Kuzzle
- La création d'Index
- La vérification de l'existence d'un Index
- La création d'une Collection
- La récupération d'une liste des Collections existantes
- La création d'un Document
- La suppression d'un Document
- La mise à jour d'un Document
- La recherche de Documents

Les parties `<template>` et `style`, étant liées a VueJS et Vuetify mais n'ayant pas d'intéraction avec Kuzzle, ne seront pas détaillées dans ce how-to, vous pouvez cependant consulter les fichier concernés parallèlement à la lecture de ce tutoriel.

## Project setup
Creation d'un projet avec Vue Cli:
```
vue create todomvc
```
Sélectionnez manuellement les features pour ajouter le '`router`'.
Sélectionnez '`Eslint + Standart config`', puis '`Lint on save`', puis '`In dedicated config files`'.
Vous pouvez maintenant lancer votre projet via la commande:
```
npm run serve
```
puis vous rendre a l'adresse http://localhost:8080/

#### Optionnal
Si vous voulez utiliser vuetify et izitoast, vous pouvez lancer les commandes suivantes et choisir la configuration par défaut:
```
vue add vuetify
npm install vue-izitoast --save
npm install material-design-icons-iconfont -D
```
Vous devez ensuite ajouter les lignes suivantes dans votre fichier `/src/main.js`:
```js
import VueIziToast from 'vue-izitoast';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'vuetify/dist/vuetify.min.css';
import 'izitoast/dist/css/iziToast.css';

Vue.use(VueIziToast);
```

## Set up your Kuzzle
### Instantiation
Dans un premier temps nous allons créer le service Kuzzle.
Ajoutez le dossier '/src/service', créez un fichier Kuzzle.js puis ajoutez le code suivant:

```js
const {
  Kuzzle,
  WebSocket
} = require('kuzzle-sdk');

const kuzzle = new Kuzzle(
  new WebSocket('localhost')
);

kuzzle.on('networkError', error => {
  console.error('Network Error: ', error);
});

export default kuzzle;
```
Nous venons d'instancier un Kuzzle et nous allons maintenant pouvoir nous y connecter.
### Connection
Créez une nouvelle la vue '`/src/views/KuzzleConnect.vue`' puis ajoutez si vous le souhaitez un `<template></template>` et un `<style></style>` pour afficher le chargement.

Ajoutez ensuite la balise `<script></script>` dans laquelle nous allons mettre en place la connection au serveur Kuzzle.

Vous devez commencer par importer le service que nous avons crée précédemment:
```js
import kuzzle from '../service/Kuzzle.js';
```

Afin de pouvoir le modifier simplement, nous allons ensuite stocker le nom de l'Index qui contiendra nos listes dans une variable:
```js
export default {
  name: 'KuzzleConnect',
  data() {
    return {
      indexName: 'todolists'
    };
  },
```
Nous allons maintenant créer un cookie `connectedToKuzzle`, puis mettre en place un appel à notre future fonction de connexion toutes les 200ms.
```js
  mounted() {
    if (!localStorage.getItem('connectedToKuzzle')) {
      localStorage.setItem('connectedToKuzzle', false);
    }
    this.interval = setInterval(this.connect, 200);
  },
```
Une fois ceci fait, nous pouvons ajouter notre fonction de connexion:
```js
  methods: {
    async connect() {
      try {
        await kuzzle.connect();
        clearInterval(this.interval);
        const exists = await kuzzle.index.exists(this.indexName);
        if (!exists) {
          await kuzzle.index.create(this.indexName);
          const mapping = {
            properties: {
              complete: { type: 'boolean' },
              task: { type: 'text' }
            }
          };
          await kuzzle.collection.create(this.indexName, 'FirstList', mapping);
        }
        localStorage.setItem('indexName', this.indexName);
        localStorage.setItem('connectedToKuzzle', true);
        this.$router.push({ name: 'home' });
      } catch (error) {
        this.$toast.info(`${error.message}`, 'INFO', {position: 'bottomLeft'});
        window.localStorage.setItem('connectedToKuzzle', false);
      }
    }
  }
```
Celle-ci va donc tenter une connexion au serveur Kuzzle puis:
 - En cas d'échec : Afficher un message d'erreur et mettre notre cookie a `false`.
 - En cas de réussite : Stopper l'appel automatique à notre fonction, créer notre index et notre première liste s'ils n'existent pas, stocker dans les cookies le nom de l'index et la connexion puis rediriger vers la page principale.

## Set up your router
Nous allons maintenant éditer le fichier `/src/router.js` pour y ajouter notre première page, la page principale `Home` qui est crée par défaut et que nous modifierons ensuite, ainsi qu'une fonction pour vérifier si nous sommes bien connecté au serveur Kuzzle.
Vous pouvez donc commencer par ajouter les pages:
```js
import Home from './views/Home.vue';
import KuzzleConnect from './views/KuzzleConnect.vue';
```
Puis créer la fonction de vérification:
```js
const checkConnected = async (to, from, next) => {
  if (!localStorage.getItem('connectedToKuzzle') 
      || localStorage.getItem('connectedToKuzzle') === 'false') {
    next('/');
    return false;
  }
  next();
  return true;
};
```
Et enfin modifier la section `routes` de notre `Router` pour rediriger automatiquement vers notre page de connexion et créer la route vers notre page principale:
```js
routes: [
    {
      path: '/',
      name: 'kuzzleConnect',
      component: KuzzleConnect
    },
    {
      path: '/home',
      beforeEnter: checkConnected,
      name: 'home',
      component: Home
    }
  ]
```

## Components
Nous allons maintenant les composants qui formeront notre page principale:
 - `Add.vue` => barre d'ajout de tache.
 - `ManageList.vue` => barre de création/sélection de liste.
 - `Menu.vue` => boutons de gestion multiple des taches (tout completer, tout supprimer) et de visualisation.
 - `ModalList.vue` => modale de création de liste.
 - `NavBar.vue` => barre de navigation permettant l'activation ou non des notifications.
 - `Task.vue` => ligne correspondant à une tache avec boutons pour compléter/supprimer.

### Add
Créez le composant `/src/components/Add.vue`
Ce composant est assez simple. La partie template sera composée d'un champ de saisie de texte ainsi que d'un bouton. Lors du click, un signal `addTask` sera envoyé au parent de ce composant, accompagné de la saisie.

### ModalList
Créez le composant `/src/components/ModalList.vue`
Ce composant doit contenir un champ de saisie de text ainsi qu'un bouton. Lors d'un click, un signal `create` sera envoyé au parent de ce composant, accompagné de la saisie.

### ManageList
Créez le composant `/src/components/ManageList.vue`
Ce composant doit contenir un composant ModalList (crée ci-dessus) qui sera actif ou non selon l'état d'une variable appelée `modal` initialisée a `false`. Le signal `create` reçu par cette ModalList doit être bindé a une fonction `create` qui émettra également un signal `createList` à son parent.
Il doit également proposer un select basé sur un tableau `lists` reçu en props, et appelant une fonction `changed` lorsque sa valeur change qui va émettre un signal `setCurrentList`. Pour finir, il doit contenir un bouton appelant une fonction `newList` qui passera la variable `modal` a `true` afin de l'activer.

### Menu
Créez le composant `/src/components/Menu.vue`
Ce composant doit afficher une checkbox, un bouton, et deux switchs.
La checkbox va permettre de passer toutes les taches affichées de l'état actif à l'état complété et inversement. Le bouton va permettre de supprimer toutes les taches affichées et complétées. Les deux switchs permettront de choisir d'afficher ou non les taches actives et les taches complétées.
Ces composants appelleront, sur changement de leur valeur associée, respectivement les fonctions suivantes, qui n'auront pour seul effet que d'émettre un signal a parent. 
 - `setSelectedTasksComplete`
 - `deleteSelectedTasks`
 - `setSeeCompletedTasks`
 - `setSeeActiveTasks`

### NavBar
Créez le composant `/src/components/NavBar.vue`
La barre de navigation ne proposera pour cette étape que la possibilité d'activer ou non les notifications. Elle devra avoir une data `toastsEnabled` qui sera bindée avec le cookie du même nom.
Lors du changement de valeur de la checkbox, la fonction `setToastEnabled` est appelée et va modifier la valeur du cookie.
Il est impératif de créer et initialiser ce cookie a `true` dès l'affichage de ce composant dans la fonction `mounted`.

### Task
Créez le composant `/src/components/Task.vue`
Ce composant correspond aux taches, il sera appelé via une boucle pour en créer autant que de taches dans notre liste en cours d'édition.
Il reçoit à sa création les props suivantes: `complete`, `index`, `message`.
Il doit contenir une checkbox envoyant un signal `setTaskComplete` dont le label sera la props `message` et un bouton envoyant un signal `deleteTask`.

## Main Page
Maintenant que les composants sont crées, nous allons pouvoir les instancier dans notre page principale, puis récupérer les signaux émis et ainsi envoyer les requêtes correspondantes a Kuzzle.

Voici l'odre dans lequel nous allons procéder:
 - Ajout des datas
 - Ajout des fonctions non liées à des évènements
 - Ajout des fonctions du composant ManageList
 - Ajout des fonctions du composant Add
 - Ajout des fonctions du composant MenuCollection
 - Ajout des fonctions des composants Task
 - Ajout de l'initialisation de la page

Encore une fois, la partie template ne sera pas détaillée ici, nous allons nous concentrer sur les fonctions faisant des appels a Kuzzle. Vous pourrez trouver le code du template dans le fichier `/src/views/Home.vue` de ce projet.

### Datas
En premier lieu, nous allons ajouter les datas suivantes: 
```js
  data() {
    return {
      //Le tableau contenant nos todoLists
      lists: [{ text: 'NameOfTheList', value: 'NameOfTheList' }],
      //Le tableau contenant nos taches dans la liste sélectionnée
      tasks: [
        {
          message: 'messageOfTheTask',
          index: 0,
          complete: false,
          displayed: true
        }
      ],
      //L'état de la checkbox pour compléter toutes les taches visibles
      completeAllTasks: false,
      //L'état du switch pour la visibilité des taches actives
      seeActiveTasks: true,
      //L'état du switch pour la visibilité des taches complétées
      seeCompletedTasks: true,
      //La liste sélectionnée
      currentList: { text: 'build', value: 'build' },
      //le nom de l'index dans lequel les todoLists sont créees
      indexName: localStorage.getItem('indexName'),
      //Les type de positionnements de nos toasts
      success: {
        position: 'bottomRight'
      },
      info: {
        position: 'bottomLeft'
      },
      error: {
        position: 'topRight'
      },
    };
  },
```

### Other Functions
Nous allons ici créer quelques fonctions qui ne seront pas directement appelées selon les signaux de nos composants mais qui vont nous permettre de mieux structurer notre code et d'éviter les redondances.


La fonction `Toasted`, elle va simplement nous permettre de centraliser la création de nos notifications et ainsi pouvoir gérer leur affichage ou non en fonction de notre cookie (cf: NavBar).
```js
toasted(type, message) {
  if (localStorage.getItem('toastsEnabled') === 'false') {
    return;
  }
  switch (type) {
    case 'info':
      this.$toast.info(message, 'INFO', this.info);
      break;
    case 'error':
      this.$toast.error(message, 'ERROR', this.error);
      break;
    case 'success':
      this.$toast.success(message, 'SUCCESS', this.success);
      break;
  }
},
```

La fonction `UpdateCompleteAll` va simplement mettre à jour l'état de notre variable `completeAllTasks` (liée au composant Menu), selon l'affichage sélectionné.
```js
updateCompleteAll() {
  let completeValue = true;
  this.tasks.some(elem => {
    if (elem.displayed && !elem.complete) {
      completeValue = false;
      return false;
    }
  });
  if (completeValue !== this.completeAllTasks) {
    this.completeAllTasks = completeValue;
  }
},
```

La fonction `UpdateDisplay` va mettre à jour l'attribut `Displayed` de chacune de nos taches en fonction des switchs de notre Menu.
```js
updateDisplay() {
  this.tasks.forEach(elem => {
    elem.displayed = (elem.complete && this.seeCompletedTasks) || (!elem.complete && this.seeActiveTasks);
  });
  this.updateCompleteAll();
},
```
Les fonctions suivantes font une requête à notre serveur Kuzzle, elles seront donc plus détaillées.
La fonction `fetchIndex` va nous permettre de récupérer toutes les todoLists actuellement créées. Elle fait appel à la fonction `list` du controller `collection` dont vous pouvez trouver la documentation [ici](https://docs-v2.kuzzle.io/sdk-reference/js/6/collection/list/)
```js
async fetchIndex() {
  this.lists = [];
  try {
    //Requête Kuzzle pour lister les collections de l'index contenu dans this.indexName
    const collectionList = await kuzzle.collection.list(this.indexName);
    //La réponse est de type:
    /*
    {
      type: 'all',
      collections: [ { name: 'todoLists', type: 'stored' } ],
      from: 1,
      size: 1
    }
    */
   //On rempli ensuite notre tableau
    this.lists = collectionList.collections.map(elem => ({text: elem.name, value:elem.name}));
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
},
```

La fonction `fetchCollection` nous permet de lister les taches contenues dans la todoList en cours d'édition. Elle utilise la fonction `search` du controller `document` donc vous pouvez trouver la documentation [ici](https://docs-v2.kuzzle.io/sdk-reference/js/6/document/search/)
```js
async fetchCollection() {
  this.tasks = [];
  let results = {};
  try {
    //Requête Kuzzle pour récupérer les 100 premiers documents contenus dans la collection this.currentList.value de l'index this.indexName triés par date de création.
    results = await kuzzle.document.search(
      this.indexName,
      this.currentList.value,
      { sort: ['_kuzzle_info.createdAt'] },
      { size: 100 }
    );
    //La réponse contiendra un tableau nommé hits dans lequel nous trouverons les informations de notre tache (index, message, complete) que nous allons mettre dans notre tableau.
    this.tasks = results.hits.map(hit => {
      return {
        message: hit._source.task,
        index: hit._id,
        complete: hit._source.complete
      };
    });
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
},
```

### Functions for ManageList signals
Nous pouvons commencer par ajouter le composant NavBar étant donné qu'il ne nécessite pas d'intéraction particulière.

Ensuite, nous allons ajouter le composant ManageList. Il prendra en paramètre notre tableau de listes et la liste sélectionnée. 
Nous allons ensuite créer deux fonctions afin de réagir aux signaux `setCurrentList` et `createList`, elles porteront respectivement les mêmes noms.

La fonction `setCurrentList` va modifier la liste en cours d'édition puis appeler nos trois fonctions précédentes afin de mettre à jour les données de nos tableaux puis celles affichées. 
```js
async setCurrentList(collection) {
  if (collection.value === '') {
    this.tasks = [];
    this.updateDisplay();
    return;
  }
  try {
    this.currentList = { text: collection.text, value: collection.value };
    await this.fetchIndex();
    await this.fetchCollection();
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateDisplay();
},
```

La fonction `createList` va effectuer une requete Kuzzle via le controller `collection` et la fonction `create` (dont la documentation est disponible [ici](https://docs-v2.kuzzle.io/sdk-reference/js/6/collection/create/)) pour créer une nouvelle todoList.
```js
async createList(input) {
  //Le mapping correspond a la structure de la collection qui va etre crée. Ici, les documents de la collection auront une propriété complete de type boolean et une propriété task de type text.
  const mapping = {
    properties: {
      complete: { type: 'boolean' },
      task: { type: 'text' }
    }
  };
  try {
    //Requête Kuzzle pour créer la collection input dans l'index this.indexName avec le mapping mapping. 
    await kuzzle.collection.create(this.indexName, input, mapping);
    //Update de la liste en cours d'édition
    this.setCurrentList({ text: input, value: input });
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
},
```

### Functions for Task signals
Dans un second temps, nous allons ajouter le composant Task. Il sera instancié autant de fois qu'il y a de tache dans notre tableau via l'utilisation d'une boucle `v-for`. Ce composant prendra en props les attributs `index`, `complete` et `message` de l'element courant dans la boucle et sera actif selon l'attribut `displayed`.
Nous avons deux foncions à ajouter pour réagir aux signaux suivants: 
`deleteTask` et `setTaskComplete`.

La fonction `deleteTask` va faire un appel à la fonction `delete` du controller `document` dont la documentation se trouve [ici](https://docs-v2.kuzzle.io/sdk-reference/js/6/document/delete/).
```js
async deleteTask(index) {
  try {
    //Requête Kuzzle pour supprimer le document dont l'index est index, dans la colelction this.currentList.value, dans l'index this.indexName
    await kuzzle.document.delete(this.indexName, this.currentList.value,index);
    //Mise à jour de notre tableau des taches
    this.tasks = this.tasks.filter(task => task.index !== index);
    //Notification
    this.toasted('info',`Task ${index} deleted`);
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateDisplay();
},
```

La fonction `setTaskComplete` va utiliser la fonction `update` du controller `document` afin de mettre a jour les données de notre tache. Vous trouverez la documentation de cette fonction [ici](https://docs-v2.kuzzle.io/sdk-reference/js/6/document/update/).
```js
async setTaskComplete(index, newValue) {
  try {
    //Requête Kuzzle pour mettre a jour le document dont l'index est index, dans la collection this.currentList.value, dans l'index this.indexName en modifiant la propriété complete avec la valeur newValue
    await kuzzle.document.update(this.indexName, this.currentList.value,index, {
      complete: newValue
    });
    //On met ensuite à jour la valeur dans notre tableau puis on affiche une notification
    const updatedTask = this.tasks.find(task => task.index === index);
    updatedTask.complete = newValue;
    this.toasted('info',`Task ${updatedTask.Task} updated`);
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateDisplay();
},
```

### Functions for Menu signals
Ensuite, nous allons ajouter le composant Menu. Ce composant prendra en props la longueur de notre tableau de taches ainsi que la variable `completeAllTasks`.
Nous avons quatre foncions à ajouter pour réagir aux signaux suivants:
`deleteSelectedTasks`, `setSelectedTasksComplete`, `setSeeActiveTasks`, `setSeeCompletedTasks`.

La fonction `deleteSelectedTasks` va simplement appeler la fonction `deleteTask` créée précédement pour chacune des taches complétées. 
```js
async deleteSelectedTasks() {
  let deleted = false;
  this.tasks.forEach(async elem => {
    if (elem.complete === true) {
      deleted = true;
      await this.deleteTask(elem.index);
    }
  });
  if (deleted === false) {
    this.toasted('error','No task completed!');
    return;
  }
  this.updateDisplay();
},
```

La fonction `setSelectedTasksComplete` va simplement faire passer toutes les taches dans le même état que la variable `completeAllTasks`.
```js
async setSelectedTasksComplete(newValue) {
  if (this.tasks.length === 0) {
    this.toasted('error','Nothing to complete');
    this.completeAllTasks = false;
    return;
  }
  this.completeAllTasks = newValue;
  this.tasks.forEach(async elem => {
    if (elem.displayed) {
      if (elem.complete !== this.completeAllTasks) {
        await this.setTaskComplete(elem.index, newValue);
      }
    }
  });
  this.updateDisplay();
},
```

La fonction `setSeeActiveTasks` va simplement inverser la valeur de la variable qui affiche ou non les taches actives puis mettre à jour l'affichage.
```js
setSeeActiveTasks(seeActiveValue) {
  this.seeActiveTasks = seeActiveValue;
  this.updateDisplay();
},
```
La fonction `setSeeCompletedTasks` va simplement inverser la valeur de la variable qui affiche ou non les taches complete puis mettre à jour l'affichage.
```js
setSeeCompletedTasks(seeCompletedValue) {
  this.seeCompletedTasks = seeCompletedValue;
  this.updateDisplay();
},
```

### Functions for Add signals
Dans un second temps, nous allons ajouter le composant Add. Nous devons juste ajouter une foncion pour réagir au signal `addTask`.

La fonction `addTask` va faire appel a la fonction `create` du controller `document` dont vous pouvez trouver la documentation [ici](https://docs-v2.kuzzle.io/sdk-reference/js/6/document/create/).
```js
async addTask(message) {
  //Etant donné que les nouvelles taches sont initialement actives, on force l'affichage de ces dernieres.
  if (!this.seeActiveTasks) {
    this.setSeeActiveTasks();
  }
  if (message === '') {
    this.toasted('error','Cannot add empty todo!');
    return;
  }
  try {
    //Requete Kuzzle pour créer un document dans la collection this.currentList.value dans l'index this.indexName, du document définit dans l'objet en 3ème parametre contenant une propriété task avec la valeur message et une propriété complete avec la valeur false.
    const Result = await kuzzle.document.create(this.indexName, this.currentList.value, {
      task: message,
      complete: false
    });
    //On ajoute ensuite la nouvelle tache dans notre tableau
    //La réponse récupérée dans Result contiendra l'id du nouveau document que l'on va stocker.
    this.tasks.push({
      message: message,
      index: Result._id,
      complete: false,
      displayed: true
    });
    this.toasted('info',`New task ${message}`);
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateDisplay();
},
```

### Initialize Main Page
Maintenant que tous est en place, il ne nous reste plus qu'à initialiser certaines données de notre page: 

```js
async mounted() {
  window.addEventListener('beforeunload', this.clearStore);
  try {
    await this.fetchIndex();
    this.currentList.text = this.lists[0].text;
    this.currentList.value = this.lists[0].value;
    await this.fetchCollection();
    this.updateDisplay();
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
}
```