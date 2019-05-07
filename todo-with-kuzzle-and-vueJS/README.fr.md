# Todo MVC Step1
## Pré-requis

[Node.js 8.9+](https://nodejs.org/en/)

[npm 5+](https://www.npmjs.com/)

[Vue CLI 3.4+](https://cli.vuejs.org/)

[vue-izitoast 1.4+](https://github.com/arthurvasconcelos/vue-izitoast)

[Vuetify 1.4+](https://vuetifyjs.com/en/)

[kuzzle-sdk JS 6+](https://docs.kuzzle.io/sdk-reference/js/6/getting-started/node-js/)

Dans ce how-to, nous supposons que vous connaissez les bases de [Vue.js](https://vuejs.org/)

## Introduction
[Kuzzle](https://kuzzle.io/) est une suite prête à l'emploi, open source
et installable sur votre serveur qui vous permet de créer des applications
Web, mobiles et IoT modernes en un rien de temps.

Pour installer Kuzzle, suivez les étapes détaillées dans [le guide d'installation](https://docs.kuzzle.io/guide/1/essentials/installing-kuzzle/).

Dans ce how-to, nous allons réaliser une simple todo-list utilisant
le schéma modèle-vue-controleur. Nous utiliserons Kuzzle pour la persistance
des données et VueJS pour la partie front-end.

Cette première partie mettra en avant les fonctionnalités de 
Kuzzle suivantes:
- la connexion à Kuzzle,
- la création d'un index,
- la vérification de l'existence d'un index,
- la création d'une collection,
- la récupération d'une liste des collections existantes,
- la création d'un document,
- la suppression d'un document,
- la mise à jour d'un document,
- la recherche de documents

Les parties `<template>` et `style`, étant liées à VueJS et Vuetify mais
n'ayant pas d'interaction avec Kuzzle, ne seront pas détaillées dans ce how-to ;
vous pouvez cependant consulter les fichiers concernés parallèlement à 
la lecture de ce tutoriel.

## Configuration du projet

Tout d'abord, créez un projet avec ([Vue-cli](https://cli.vuejs.org/guide/creating-a-project.html)) comprenant les fonctionnalités
router et vuex.

Nous allons ensuite mettre en place le gestionnaire d'état ([vuex](https://vuex.vuejs.org/fr/)),
qui nous permettra de stocker et d'utiliser certaines données devant
être globales à notre application.

Pour cela, modifiez l'export du fichier `/src/store.js` de la façon suivante :
```js
export default new Vuex.Store({
  state: {
    connectedToKuzzle: false
  },
  mutations: {
    setConnection(state, value) {
      state.connectedToKuzzle = value;
    }
  }
});
```

## Se connecter à Kuzzle
### Instanciation
Dans un premier temps nous allons créer le service Kuzzle.
Ajoutez le dossier '/src/service', créez un fichier Kuzzle.js
puis ajoutez le code suivant :

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
Nous venons d'instancier un Kuzzle et nous allons maintenant pouvoir
nous y connecter.

### Connexion
Créez la vue '`/src/views/KuzzleConnect.vue`' puis ajoutez
les parties `<template></template>` et `<style></style>`
du fichier `KuzzleConnect.vue` présent dans ce projet pour afficher 
le chargement.

Ajoutez ensuite la balise `<script></script>` dans laquelle nous allons
mettre en place la connexion au serveur Kuzzle.

Commencez par importer le service que nous avons créé 
précédemment, ainsi que le store :
```js
import kuzzle from '../service/Kuzzle.js';
import store from '../store.js';
```

Nous allons maintenant ajouter des Listener sur notre Kuzzle afin
d'être informé lors des évènements de connexion ou de déconnexion.
Ensuite, nous allons mettre en place un appel à notre fonction
de connexion toutes les secondes, jusqu'à ce que celle-ci soit établie.
```js
  mounted() {
    kuzzle
      .addListener('connected', () => {
        store.commit('setConnection', true);
        this.$router.push({ name: 'home' });
      })
      .addListener('disconnected', () => {
        store.commit('setConnection', false);
        this.$router.push({ name: 'kuzzleConnect' });
      });
    this.interval = setInterval(this.connect, 1000);
  },
```
Une fois ceci fait, nous pouvons créer notre fonction de connexion :
```js
methods: {
  async connect() {
    try {
      // Connexion à Kuzzle
      await kuzzle.connect();
      // En cas de réussite, on stoppe l'appel automatique à la 
      // fonction connect()
      clearInterval(this.interval);
      // L'index qui contiendra nos listes s'appellera 'todolists'
      // On commence par vérifier s'il existe 
      const exists = await kuzzle.index.exists('todolists');
      if (!exists) {
        //Si ce n'est pas le cas on le crée
        await kuzzle.index.create('todolists');
        const mapping = {
          properties: {
            complete: { type: 'boolean' },
            task: { type: 'text' }
          }
        };
        // On ajoute également la collection 'FirstList'
        // selon le mapping décrit ci-dessus
        // Notre collection aura donc deux champs: 
        // complete de type booléen (si la tache à été réalisée) 
        // et task de type texte (le texte de la tache)
        await kuzzle.collection.create('todolists', 'FirstList', mapping);
      }
    } catch (error) {
      // En cas d'erreur on l'affiche via un toast
      this.$toast.info(`${error.message}`, 'INFO', {
        position: 'bottomLeft'
      });
    }
  }
},
```

## Configuration du routeur
Nous allons maintenant éditer le fichier `/src/router.js` pour y ajouter
notre page `kuzzleConnect`. La page principale `Home` qui est créée par
défaut et que nous modifierons ensuite est déjà importée dans notre routeur.
Nous allons également écrire une fonction pour vérifier si nous sommes bien
connectés au serveur Kuzzle.

Ajoutez les lignes suivantes au début du fichier `/src/router.js` :
```js
import KuzzleConnect from './views/KuzzleConnect.vue';
import store from './store';
```

Puis créez la fonction de vérification :

```js
const checkConnected = async (to, from, next) => {
  // Récupération de la variable dans le store
  const connection = store.state.connectedToKuzzle;
  // Si la connection a Kuzzle n'est pas encore établie,
  // on redirige l'utilisateur notre page KuzzleConnect
  // qui correspond à la racine de notre site '/'
  if (!connection) {
    next('/');
    return false;
  }
  next();
  return true;
};
```

Modifiez la section `routes` du `Router` pour mettre
notre page de connexion à la racine de notre site.
Ajoutez ensuite la route vers notre page principale `/home`

```js
base: process.env.BASE_URL || '/',
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

## Composants
Nous allons maintenant ajouter les composants qui formeront notre page
principale :
 - `Add.vue` => barre d'ajout de tache ;
 - `ManageList.vue` => barre de création/sélection de liste ;
 - `Menu.vue` => boutons de gestion multiple des taches 
    (tout completer, tout supprimer) et de visualisation ;
 - `ModalList.vue` => modale de création de listes ;
 - `NavBar.vue` => barre de navigation permettant l'activation ou non
    des notifications ;
 - `Task.vue` => ligne correspondant à une tache avec boutons pour
    compléter/supprimer.

La construction de ces composants ne sera pas détaillée étant donné
qu'ils n'ont aucune interaction directe avec Kuzzle. Vous pouvez vous
référer aux fichiers correspondants pour avoir un exemple de code.

### Add
Créez le fichier `/src/components/Add.vue`
Ce composant est assez simple. La partie template sera composée d'un
champ de saisie de texte ainsi que d'un bouton. Lors du click, un signal
`addTask` sera envoyé au parent de ce composant, accompagné de la saisie.

### ModalList
Créez le fichier `/src/components/ModalList.vue`
Ce composant doit contenir un champ de saisie de texte ainsi qu'un bouton.
Lors d'un click, un signal `create` sera envoyé au parent de ce composant,
accompagné de la saisie.

### ManageList
Créez le fichier `/src/components/ManageList.vue`
Ce composant doit contenir: 
  Un composant ModalList (créé ci-dessus) qui sera affiché ou non selon l'état
  d'une variable appelée `modal` initialisée à `false`.
  Le signal `create` reçu par cette ModalList doit être relié à une fonction
  `create`, qui transmettra à son tour l'information au composant parent via 
  l'émission d'un signal `createList`.
  
  Une liste d'options basée sur un tableau `lists` reçu en props.
  Lorsque l'élément sélectionné de cette liste change, une fonction `changed`
  doit être appelée. Cette-dernière va émettre un signal `setCurrentList`. 

  Un bouton appelant une fonction `newList` qui passera la variable `modal`
  à `true` afin de l'activer.

### Menu
Créez le fichier `/src/components/Menu.vue`
Ce composant doit afficher: 
  Une checkbox qui va permettre de passer toutes les taches affichées de l'état
  actif à l'état complété et inversement. Un changement de sa valeur appelle la
  fonction `setSelectedTasksComplete` qui va émettre un signal au composant
  parent.

  Un bouton qui va permettre de supprimer toutes les taches complétées. Un click
  sur ce bouton appellera la fonction `deleteSelectedTasks` qui va également 
  émettre un signal au composant parent.
  
  Deux switchs qui permettront de choisir d'afficher ou non les taches actives
  et les taches complétées. Des changements de valeurs de ces switch 
  appelleront respectivement les fonctions `setSeeActiveTasks` et
  `setSeeCompletedTasks` qui se chargeront également d'émettre un signal.

### NavBar
Créez le fichier `/src/components/NavBar.vue`
La barre de navigation ne proposera pour cette étape que la possibilité 
d'activer ou non les notifications. Elle devra avoir une data `toastsEnabled`
qui sera reliée avec un cookie du même nom.
Lors du changement de valeur de la checkbox, la fonction `setToastEnabled`
est appelée et va modifier la valeur du cookie.
Il faut ensuite créer et initialiser ce cookie s'il n'existe pas, dans la 
fonction `mounted` de ce composant.

### Task
Créez le fichier `/src/components/Task.vue`
Ce composant correspond aux taches, il sera affiché via une boucle pour en 
créer autant que de taches dans notre liste en cours d'édition.
Il reçoit à sa création les props suivantes: `complete`, `index`, `message`.
Il doit contenir une checkbox envoyant un signal `setTaskComplete` dont le
label sera la props `message` et un bouton envoyant un signal `deleteTask`.

## Page principale
Maintenant que les composants sont créés, nous allons pouvoir les instancier
dans notre page principale, puis récupérer les signaux émis et ainsi envoyer
les requêtes correspondantes à Kuzzle.

Voici l'ordre dans lequel nous allons procéder :
 - Ajout des données
 - Ajout des fonctions non liées à des évènements
 - Ajout des fonctions du composant ManageList
 - Ajout des fonctions du composant Add
 - Ajout des fonctions du composant MenuCollection
 - Ajout des fonctions des composants Task
 - Ajout de l'initialisation de la page

Encore une fois, la partie template ne sera pas détaillée ici, nous allons nous
concentrer sur les fonctions faisant des appels à Kuzzle. Afin de bien relier 
les fonctions aux évènements émis par les différents composants, référez vous 
au fichier `/src/views/Home.vue` de ce projet.

### Data
En premier lieu, ajoutez les data suivantes: 
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
          complete: false
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
      //le nom de l'index dans lequel les todoLists sont créées
      indexName: 'todolists'
    };
  },
```

### Autres Fonctions
Les quelques fonctions présentes dans cette section ne seront pas reliées
aux signaux de nos composants mais vont nous permettre de mieux
structurer notre code et d'éviter les redondances.

Commencez par ajouter la fonction `Toasted`. Elle va simplement nous permettre
de centraliser la création de nos notifications et ainsi pouvoir gérer leur
affichage ou non en fonction de notre cookie (cf: NavBar).
```js
toasted(type, message) {
  if (localStorage.getItem('toastsEnabled') === 'false') {
    return;
  }
  const position = {
    position: 'bottomRight'
  };
  switch (type) {
    case 'info':
      this.$toast.info(message, 'INFO', position);
      break;
    case 'error':
      this.$toast.error(message, 'ERROR', position);
      break;
    case 'success':
      this.$toast.success(message, 'SUCCESS', position);
      break;
  }
},
```

Ajoutez ensuite la fonction `UpdateCompleteAll`. Celle-ci va mettre à jour 
l'état de notre variable`completeAllTasks` (et donc de la checkbox 
correspondante dans le composant Menu), selon l'état des taches affichées.
```js
updateCompleteAll() {
  let completeValue = true;
  this.tasks.some(elem => {
    if (!elem.complete) {
      completeValue = false;
      return false;
    }
  });
  if (completeValue !== this.completeAllTasks) {
    this.completeAllTasks = completeValue;
  }
},
```

Ajoutez maintenant la fonction `fetchIndex`. Elle nous permettra de récupérer toutes les listes
actuellement créées. Elle fait appel à la fonction `list` du contrôleur
`collection` dont vous pouvez trouver la documentation [ici](https://docs.kuzzle.io/sdk-reference/js/6/collection/list/)
```js
async fetchIndex() {
  this.lists = [];
  try {
    // Requête Kuzzle pour lister les collections de
    // l'index this.indexName ('todolists')
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
   // On rempli ensuite notre tableau de listes
    this.lists = collectionList.collections.map(elem => (
      {text: elem.name, value:elem.name}
    ));
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
},
```

Ajoutez également la fonction `fetchCollection` qui va nous permettre de lister
les taches contenues dans la liste en cours d'édition. Elle utilise la fonction
`search` du contrôleur `document` dont vous pouvez trouver la documentation [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/search/)
```js
async fetchCollection() {
  this.tasks = [];
  let results = {};
  try {
    // Requête Kuzzle pour récupérer premiers documents contenus dans
    // la collection this.currentList.value de l'index this.indexName
    // triés par date de création.
    // L'objet contenant size est une option nous permettant de limiter
    // le nombre de taches reçues aux 100 premières.
    results = await kuzzle.document.search(
      this.indexName,
      this.currentList.value,
      { sort: ['_kuzzle_info.createdAt'] },
      { size: 100 }
    );
    // La réponse contiendra un tableau nommé hits dans lequel nous trouverons
    // les informations de notre tache (_id, message, complete) que nous
    // allons mettre dans notre tableau.
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

### Fonctions pour les signaux du composant ManageList
Le composant ManageList prend en paramètre notre tableau de listes ainsi que
la liste sélectionnée. 
Deux fonctions sont nécessaires afin de réagir aux signaux `setCurrentList` et
`createList` reçus, elles porteront respectivement les mêmes noms.

Commencez par ajouter la fonction `setCurrentList`, qui va modifier la liste
en cours d'édition puis appeler nos trois fonctions précédentes
(fetchIndex, fetchCollection et updateCompleteAll) afin de mettre à jour les
données de nos tableaux puis celles affichées. 
```js
async setCurrentList(collection) {
  if (collection.value === '') {
    this.tasks = [];
    this.updateCompleteAll();
    return;
  }
  try {
    this.currentList = { text: collection.text, value: collection.value };
    await this.fetchIndex();
    await this.fetchCollection();
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateCompleteAll();
},
```

Ajoutez ensuite la fonction `createList`, qui va effectuer une requête a la
fonction `create` du contrôleur `collection` de Kuzzle (dont la documentation
est disponible [ici](https://docs.kuzzle.io/sdk-reference/js/6/collection/create/)) pour créer une nouvelle todoList.
```js
async createList(input) {
  // Le mapping correspond a la structure de la collection qui va etre crée.
  // Comme expliqué plus haut, les documents de la collection auront une propriété complete de
  // type booléen et une propriété task de type texte.
  const mapping = {
    properties: {
      complete: { type: 'boolean' },
      task: { type: 'text' }
    }
  };
  try {
    // Requête Kuzzle pour créer la collection input dans l'index
    // this.indexName avec le mapping mapping. 
    await kuzzle.collection.create(this.indexName, input, mapping);
    // Mise à jour de la liste en cours d'édition
    this.setCurrentList({ text: input, value: input });
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
},
```

### Fonctions pour les signaux du composant Task
Le composant Task instancié autant de fois qu'il y a de tache dans notre 
tableau via l'utilisation d'une boucle `v-for`. Ce composant prendra en props
les attributs `index`, `complete` et `message` de l'element courant dans la
boucle et sera actif selon l'attribut `displayed`.
Ici encore, deux fonction son nécessaires pour réagir aux signaux suivants: 
`deleteTask` et `setTaskComplete`.

Ajoutez la fonction `deleteTask`, qui va faire un appel à la fonction `delete` du contrôleur
`document` dont la documentation se trouve [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/delete/).
```js
async deleteTask(index) {
  try {
    // Requête Kuzzle pour supprimer le document dont l'index est index, 
    // dans la collection this.currentList.value, dans l'index this.indexName
    await kuzzle.document.delete(this.indexName, this.currentList.value, index);
    // Mise à jour de notre tableau des taches
    this.tasks = this.tasks.filter(task => task.index !== index);
    // Notification
    this.toasted('info',`Task ${index} deleted`);
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateCompleteAll();
},
```

Puis ajoutez la fonction `setTaskComplete`, qui va utiliser la fonction 
`update` du contrôleur `document` afin de mettre à jour les données de notre
tache. Vous trouverez la documentation de cette fonction [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/update/).
```js
async setTaskComplete(index, newValue) {
  try {
    // Requête Kuzzle pour mettre à jour le document dont l'index est index,
    // dans la collection this.currentList.value, dans l'index this.indexName
    // en modifiant la propriété complete avec la valeur newValue
    await kuzzle.document.update(this.indexName, this.currentList.value, index, {
      complete: newValue
    });
    // On met ensuite à jour la valeur dans notre tableau puis on affiche
    // une notification
    const updatedTask = this.tasks.find(task => task.index === index);
    updatedTask.complete = newValue;
    this.toasted('info',`Task ${updatedTask.Task} updated`);
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateCompleteAll();
},
```

### Fonctions pour les signaux du composant Menu
Le composant Menu prendra en props la longueur de notre tableau de taches ainsi
que la variable `completeAllTasks`. Cette fois ci, quatre foncions seront 
nécessaires pour réagir aux signaux suivants: `deleteSelectedTasks`,
`setSelectedTasksComplete`, `setSeeActiveTasks`, `setSeeCompletedTasks`.

Ajoutez la fonction `deleteSelectedTasks`, elle va appeler la fonction
`deleteTask` créée précédemment pour chacune des taches complétées. 
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
  this.updateCompleteAll();
},
```

Ajoutez ensuite la fonction `setSelectedTasksComplete`, qui va simplement faire
passer la valeur complete de chaque tache dans le même état que la variable
`completeAllTasks`.
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
  this.updateCompleteAll();
},
```

Puis ajoutez la fonction `setSeeActiveTasks`, qui va inverser la valeur de la
variable qui active ou non l'affichage des taches non complétées puis mettre à
jour l'affichage.
```js
setSeeActiveTasks(seeActiveValue) {
  this.seeActiveTasks = seeActiveValue;
  this.updateCompleteAll();
},
```

Enfin, ajoutez la fonction `setSeeCompletedTasks` qui va quant à elle inverser
la valeur de la variable qui active ou non l'affichage des taches complétées
puis mettre à jour l'affichage.
```js
setSeeCompletedTasks(seeCompletedValue) {
  this.seeCompletedTasks = seeCompletedValue;
  this.updateCompleteAll();
},
```

### Fonctions pour les signaux du composant Add
Le composant Add nécessite une seule fonction qui va réagir au signal `addTask`.

Celle-ci va faire appel à la fonction `create` du contrôleur `document` dont
vous pouvez trouver la documentation [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/create/).
```js
async addTask(message) {
  // Les nouvelles taches étant initialement actives,
  // on force l'affichage de ces dernieres.
  if (!this.seeActiveTasks) {
    this.setSeeActiveTasks();
  }
  if (message === '') {
    this.toasted('error','Cannot add empty todo!');
    return;
  }
  try {
    // Requête Kuzzle pour créer un document dans la collection 
    // this.currentList.value dans l'index this.indexName, du document définit
    // dans l'objet en 3ème paramètre contenant une propriété task avec la 
    // valeur message et une propriété complete avec la valeur false.
    const Result = await kuzzle.document.create(this.indexName,
    this.currentList.value, {
      task: message,
      complete: false
    });
    // On ajoute ensuite la nouvelle tache dans notre tableau
    // La réponse récupérée dans Result contiendra l'id du nouveau document
    // que l'on va stocker.
    this.tasks.push({
      message: message,
      index: Result._id,
      complete: false,
    });
    this.toasted('info',`New task ${message}`);
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
  this.updateCompleteAll();
},
```

### Initialisation de la page principale
Maintenant que tout est en place, il ne nous reste plus qu'à initialiser
certaines données de notre page: 

Ajoutez la fonction `mounted` suivante: 
```js
async mounted() {
  this.seeActiveTasks = true;
  this.seeCompletedTasks = true;
  try {
    await this.fetchIndex();
    this.currentList.text = this.lists[0].text;
    this.currentList.value = this.lists[0].value;
    await this.fetchCollection();
    this.updateCompleteAll();
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
}
```

Vous devez maintenant avoir une todo MVC fonctionnelle que vous pouvez lancer
via la commande suivante : `npm run serve`, après avoir au préalable lancé
votre kuzzle `docker-compose up`.k