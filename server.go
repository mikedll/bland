package main

import (
	"encoding/json"
	"net/http"
	"io/ioutil"
	"path/filepath"
	"log"
	"os"
	"database/sql"
	_ "github.com/lib/pq"
	"github.com/joho/godotenv"
	"strings"
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
	
	staticServe := func(relativePath string, w http.ResponseWriter, req *http.Request) {
		parts := strings.Split(relativePath, "/")

		for _, part := range parts {
			if part == ".." {
				w.WriteHeader(http.StatusNotFound)
				return
			}
		}
		
		mimeTypes := map[string]string{
			"js": "text/javascript",
			"map": "application/octet-stream",
			"html": "text/html",
		}
		
		bytes, err := ioutil.ReadFile(cwd + "/public/" + relativePath)
		if os.IsNotExist(err) {
			log.Println("File not found: " + relativePath)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		ext := filepath.Ext(relativePath)
		fileExt := ext[1:len(ext)]

		var ok bool
		mimeType := ""
		if mimeType, ok = mimeTypes[fileExt]; !ok {
			log.Println("Couldn't find mime type for " + relativePath)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		
		w.Header().Add("Content-Type", mimeType)
		w.Write(bytes)		
		log.Println("Served static: public/" + relativePath)
	}
	
	public := func(w http.ResponseWriter, req *http.Request) {
		prefix := "/public/"
		relativePath := req.URL.Path[len(prefix):len(req.URL.Path)]
		staticServe(relativePath, w, req)
	}
	
	root := func(w http.ResponseWriter, req *http.Request) {
		if(req.URL.Path != "/") {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		
		staticServe("index.html", w, req)
	}

	type Person struct {
		Id int64    `json:"id"`
		Name string `json:"name"`
	}

	respErr := func(s string, w http.ResponseWriter) {
		log.Println(s)
		w.WriteHeader(http.StatusInternalServerError)
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

	http.Handle("/", http.HandlerFunc(root))
	http.Handle("/people", http.HandlerFunc(handlePeople))
	http.Handle("/public/", http.HandlerFunc(public))

	log.Println("Booting up...")
	
	var addr string = "localhost:8081"
	err = http.ListenAndServe(addr, nil)
	if err != nil {
		log.Fatal("ListenAndServer: ", err)
	}

}
