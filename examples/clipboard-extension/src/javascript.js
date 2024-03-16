console.log('Hello javascript');
console.log('ENV \n', process.env);

let index = 0;

(function recursive() {
  if (index > 10) return;
  
  setTimeout(() => {
    index += 1; 
    console.log('Index: ', index);
    recursive();
  }, 1000);
})()
