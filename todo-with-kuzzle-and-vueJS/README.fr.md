# Todo MVC Step1
## Pré-requis

Node.js

npm

## Introduction
Kuzzle permet de gérer de nombreuses données de manière très simple.

Afin de l'installer, vous pouvez vous rendre [ici](https://docs.kuzzle.io/guide/1/essentials/installing-kuzzle/).

Dans ce how-to, nous allons réaliser une simple todo-list utilisant 
le pattern modèle-vue-controleur avec Kuzzle et VueJS.

Cette première partie mettra en avant les fonctionnalités de 
Kuzzle telles que:
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
n'ayant pas d'interaction avec Kuzzle, ne seront pas détaillées dans ce how-to;
vous pouvez cependant consulter les fichiers concernés parallèlement à 
la lecture de ce tutoriel.

## Configuation du projet
Commençons par installer Vue Cli : 
```
npm install -g @vue/cli
```

Nous pouvons maintenant créer un projet :
```
vue create todomvc
```
Ajoutez manuellement les fonctionnalités suivantes au projet : `router`
et `vuex`.
Sélectionnez ensuite '`Eslint + Standard config`', puis '`Lint on save`',
et enfin '`In dedicated config files`'.
Vous pouvez maintenant lancer votre projet via la commande :
```
npm run serve
```
puis vous rendre a l'adresse http://localhost:8080/.

Nous allons maintenant mettre en place le store, qui nous permettra de
stocker et d'utiliser certaines données devant être globales à notre 
application.

Pour cela, modifiez l'export du fichier `/src/store.js` de la façon suivante :
```js
export default new Vuex.Store({
  state: {
    connectedToKuzzle: false,
    indexName: 'todolists'
  },
  mutations: {
    setConnection(state, value) {
      state.connectedToKuzzle = value;
    }
  }
});
```

#### Framework et plugin
Nous allons utiliser Vuetify pour les templates, 
ainsi que vue-izitoast pour afficher des notifications.

Afin de les installer lancez les commandes suivantes et
choisissez la configuration par défaut :
```
vue add vuetify
npm install vue-izitoast --save
npm install material-design-icons-iconfont -D
```
Ajoutez ensuite les lignes suivantes dans le fichier `/src/main.js` :
```js
import VueIziToast from 'vue-izitoast';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'vuetify/dist/vuetify.min.css';
import 'izitoast/dist/css/iziToast.css';

Vue.use(VueIziToast);
```

## Se connecter à Kuzzle
### Instanciation
Dans un premier temps nous allons ajouter le sdk javascript au projet: 
```
npm install kuzzle-sdk --save
```
Nous pouvons ensuite créer le service Kuzzle.
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
de connexion toutes les 200 ms, jusqu'à ce que celle-ci soit établie.
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
    this.interval = setInterval(this.connect, 200);
  },
```
Une fois ceci fait, nous pouvons créer notre fonction de connexion :
```js
methods: {
  async connect() {
    // Récupération du nom de l'index dans le store
    const indexName = this.$store.state.indexName;
    try {
      // Connexion à Kuzzle
      await kuzzle.connect();
      // En cas de réussite, on stoppe l'appel automatique à la 
      // fonction connect()
      clearInterval(this.interval);
      // On vérifie si l'index dont on a besoin est déjà créé
      const exists = await kuzzle.index.exists(indexName);
      if (!exists) {
        //Si ce n'est pas le cas on l'ajoute
        await kuzzle.index.create(indexName);
        const mapping = {
          properties: {
            complete: { type: 'boolean' },
            task: { type: 'text' }
          }
        };
        // On ajoute également la collection 'FirstList'
        // selon le mapping décrit ci-dessus
        // Notre collection aura donc deux champs: complete 
        // et task, respectivement de types boolean et text
        await kuzzle.collection.create(indexName, 'FirstList', mapping);
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
  // Si l'on n'est pas connecté, on redirige vers la page de
  // connexion qui correspond à la racine de notre site
  if (!connection) {
    next('/');
    return false;
  }
  next();
  return true;
};
```

Nous pouvons maintenant modifier la section `routes` de notre
`Router` pour rediriger automatiquement vers notre page de
connexion et créer la route vers notre page principale :

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
Ce composant doit contenir un composant ModalList (créé ci-dessus) qui sera
actif ou non selon l'état d'une variable appelée `modal` initialisée à `false`.
Le signal `create` reçu par cette ModalList doit être relié à une fonction
`create` qui émettra également un signal `createList` à son parent.
Il doit également proposer un select basé sur un tableau `lists` reçu en props,
et appelant une fonction `changed` lorsque sa valeur change qui va émettre un
signal `setCurrentList`. Pour finir, il doit contenir un bouton appelant une 
fonction `newList` qui passera la variable `modal` à `true` afin de l'activer.

### Menu
Créez le fichier `/src/components/Menu.vue`
Ce composant doit afficher une checkbox, un bouton, et deux switchs.
La checkbox va permettre de passer toutes les taches affichées de l'état actif
à l'état complété et inversement. Le bouton va permettre de supprimer toutes
les taches affichées et complétées. Les deux switchs permettront de choisir
d'afficher ou non les taches actives et les taches complétées.
Ces composants appelleront, sur changement de leur valeur associée, 
respectivement les fonctions suivantes, qui n'auront pour seul effet que
d'émettre un signal au parent. 
 - `setSelectedTasksComplete`
 - `deleteSelectedTasks`
 - `setSeeCompletedTasks`
 - `setSeeActiveTasks`

### NavBar
Créez le fichier `/src/components/NavBar.vue`
La barre de navigation ne proposera pour cette étape que la possibilité 
d'activer ou non les notifications. Elle devra avoir une data `toastsEnabled`
qui sera reliée avec le cookie du même nom.
Lors du changement de valeur de la checkbox, la fonction `setToastEnabled`
est appelée et va modifier la valeur du cookie.
Il faut ensuite créer et initialiser ce cookie s'il n'existe pas, dans la 
fonction `mounted` de ce composant.

### Task
Créez le fichier `/src/components/Task.vue`
Ce composant correspond aux taches, il sera appelé via une boucle pour créer
autant de fois ce composant que de taches dans notre liste en cours d'édition.
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
concentrer sur les fonctions faisant des appels à Kuzzle. Vous pourrez trouver
le code du template dans le fichier `/src/views/Home.vue` de ce projet.

### Data
En premier lieu, nous allons ajouter les data suivantes: 
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
      indexName: this.$store.state.indexName,
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

### Autres Fonctions
Nous allons ici créer quelques fonctions qui ne seront pas directement appelées
selon les signaux de nos composants mais qui vont nous permettre de mieux
structurer notre code et d'éviter les redondances.

La fonction `Toasted` va simplement nous permettre de centraliser la création
de nos notifications et ainsi pouvoir gérer leur affichage ou non en fonction
de notre cookie (cf: NavBar).
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

La fonction `UpdateCompleteAll` va simplement mettre à jour l'état de notre
variable `completeAllTasks` (liée au composant Menu), selon l'affichage
sélectionné.
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

Les fonctions suivantes font une requête à notre serveur Kuzzle, 
elles seront donc plus détaillées.

La fonction `fetchIndex` va nous permettre de récupérer toutes les todoLists
actuellement créées. Elle fait appel à la fonction `list` du contrôleur
`collection` dont vous pouvez trouver la documentation [ici](https://docs.kuzzle.io/sdk-reference/js/6/collection/list/)
```js
async fetchIndex() {
  this.lists = [];
  try {
    // Requête Kuzzle pour lister les collections de l'index contenu
    // dans this.indexName
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
   // On rempli ensuite notre tableau
    this.lists = collectionList.collections.map(elem => (
      {text: elem.name, value:elem.name}
    ));
  } catch (error) {
    this.toasted('error',`${error.message}`);
  }
},
```

La fonction `fetchCollection` nous permet de lister les taches contenues dans
la todoList en cours d'édition. Elle utilise la fonction `search` du contrôleur
`document` donc vous pouvez trouver la documentation [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/search/)
```js
async fetchCollection() {
  this.tasks = [];
  let results = {};
  try {
    // Requête Kuzzle pour récupérer les 100 premiers documents contenus dans
    // la collection this.currentList.value de l'index this.indexName
    // triés par date de création.
    results = await kuzzle.document.search(
      this.indexName,
      this.currentList.value,
      { sort: ['_kuzzle_info.createdAt'] },
      { size: 100 }
    );
    // La réponse contiendra un tableau nommé hits dans lequel nous trouverons
    // les informations de notre tache (index, message, complete) que nous
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
Nous pouvons commencer par ajouter le composant NavBar étant donné 
qu'il ne nécessite pas d'interaction particulière.

Ensuite, nous allons ajouter le composant ManageList. Il prendra en
paramètre notre tableau de listes et la liste sélectionnée. 
Nous allons ensuite créer deux fonctions afin de réagir aux signaux
`setCurrentList` et `createList`, elles porteront respectivement les
mêmes noms.

La fonction `setCurrentList` va modifier la liste en cours d'édition puis
appeler nos trois fonctions précédentes afin de mettre à jour les données
de nos tableaux puis celles affichées. 
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

La fonction `createList` va effectuer une requête Kuzzle via le contrôleur
`collection` et la fonction `create` (dont la documentation est disponible [ici](https://docs.kuzzle.io/sdk-reference/js/6/collection/create/))
pour créer une nouvelle todoList.
```js
async createList(input) {
  // Le mapping correspond a la structure de la collection qui va etre crée.
  // Ici, les documents de la collection auront une propriété complete de
  // type boolean et une propriété task de type text.
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
Dans un second temps, nous allons ajouter le composant Task. Il sera instancié
autant de fois qu'il y a de tache dans notre tableau via l'utilisation d'une
boucle `v-for`. Ce composant prendra en props les attributs `index`, `complete`
et `message` de l'element courant dans la boucle et sera actif selon l'attribut
`displayed`.
Nous avons deux foncions à ajouter pour réagir aux signaux suivants: 
`deleteTask` et `setTaskComplete`.

La fonction `deleteTask` va faire un appel à la fonction `delete` du contrôleur
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

La fonction `setTaskComplete` va utiliser la fonction `update` du contrôleur
`document` afin de mettre à jour les données de notre tache. Vous trouverez
la documentation de cette fonction [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/update/).
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
Ensuite, nous allons ajouter le composant Menu. Ce composant prendra en props
la longueur de notre tableau de taches ainsi que la variable `completeAllTasks`.
Nous avons quatre foncions à ajouter pour réagir aux signaux suivants:
`deleteSelectedTasks`, `setSelectedTasksComplete`, `setSeeActiveTasks`,
`setSeeCompletedTasks`.

La fonction `deleteSelectedTasks` va simplement appeler la fonction
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

La fonction `setSelectedTasksComplete` va simplement faire passer toutes
les taches dans le même état que la variable `completeAllTasks`.
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

La fonction `setSeeActiveTasks` va simplement inverser la valeur de la variable
qui affiche ou non les taches actives puis mettre à jour l'affichage.
```js
setSeeActiveTasks(seeActiveValue) {
  this.seeActiveTasks = seeActiveValue;
  this.updateCompleteAll();
},
```
La fonction `setSeeCompletedTasks` va simplement inverser la valeur de la
variable qui affiche ou non les taches complete puis mettre à jour l'affichage.
```js
setSeeCompletedTasks(seeCompletedValue) {
  this.seeCompletedTasks = seeCompletedValue;
  this.updateCompleteAll();
},
```

### Fonctions pour les signaux du composant Add
Dans un second temps, nous allons ajouter le composant Add. Nous devons juste
ajouter une fonction pour réagir au signal `addTask`.

La fonction `addTask` va faire appel à la fonction `create` du contrôleur
`document` dont vous pouvez trouver la documentation [ici](https://docs.kuzzle.io/sdk-reference/js/6/document/create/).
```js
async addTask(message) {
  // Etant donné que les nouvelles taches sont initialement actives,
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
votre kuzzle `docker-compose up` comme précisé au début de ce how-to.