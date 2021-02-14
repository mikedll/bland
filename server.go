package main

import (
	"encoding/json"
	"net/http"
	"io/ioutil"
	"log"
	"os"
	"database/sql"
	_ "github.com/lib/pq"
	"github.com/joho/godotenv"
	"github.com/gorilla/mux"
)

func main() {

	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal(err.Error())
		return
	}

	err = godotenv.Load()
	if err != nil {
		log.Fatal(err.Error())
	}

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err.Error())
	}
	defer db.Close()

	respErr := func(s string, w http.ResponseWriter) {
		log.Println(s)
		w.WriteHeader(http.StatusInternalServerError)
	}

	root := func(w http.ResponseWriter, req *http.Request) {
		bytes, err := ioutil.ReadFile(cwd + "/public/index.html")
		if os.IsNotExist(err) {
			respErr(err.Error(), w)
			return
		}
		
		w.Header().Add("Content-Type", "text/html")
		w.Write(bytes)		
		log.Println("Served root.")
	}

	type Person struct {
		Id int64    `json:"id"`
		Name string `json:"name"`
	}
	
	newPerson := func(w http.ResponseWriter, req *http.Request) {
		decoder := json.NewDecoder(req.Body)

		newPerson := Person{}
		decoder.Decode(&newPerson)

		res, err := db.Query("INSERT INTO persons (name) VALUES ($1) returning id", newPerson.Name)
		if err != nil {
			respErr(err.Error(), w)
			return
		}
		defer res.Close()

		if res.Next() {
			res.Scan(&newPerson.Id)
		}

		w.Header().Add("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)

		json, err := json.Marshal(newPerson)
		if err != nil {
			respErr(err.Error(), w)
			return
		}
		
		w.Write(json)
		log.Println("Served POST /people")
	}
	
	handlePeople := func(w http.ResponseWriter, req *http.Request) {
		if req.Method == "POST" {
			newPerson(w, req)
			return
		}
		
		people := []Person{}

		rows, err := db.Query("select id, name from persons")
		if err != nil {
			respErr(err.Error(), w)
			return
		}
		defer rows.Close()

		for rows.Next() {
			next := Person{}
			err = rows.Scan(&next.Id, &next.Name)
			if err != nil {
				respErr(err.Error(), w)
				return
			}
			
			people = append(people, next)
		}

		peopleJson, err := json.Marshal(people)
		if err != nil {
			respErr(err.Error(), w)
			return
		}
		
		w.Header().Add("Content-Type", "application/json");
		w.Write(peopleJson);
		log.Println("Served GET /people")
	}

	router := mux.NewRouter()
	router.HandleFunc("/", root)
	router.HandleFunc("/people", handlePeople)
	router.PathPrefix("/public").Handler(http.StripPrefix("/public/", http.FileServer(http.Dir(cwd + "/public"))))
	
	http.Handle("/", router)

	log.Println("Booting up...")
	
	var addr string = "localhost:8081"
	err = http.ListenAndServe(addr, nil)
	if err != nil {
		log.Fatal("ListenAndServer: ", err)
	}

}
