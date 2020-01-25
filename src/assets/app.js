const options = {
  data: {
    Apple: null,
    Microsoft: null,
    Google: 'https://placehold.it/250x250',
  },
};
document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.autocomplete');
  console.log(elems);
  var instances = M.Autocomplete.init(elems, options);
});
