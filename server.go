package main

import (
	"fmt"
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
		log.Fatal("Error finding cwd.")
		return
	}

	loadErr := godotenv.Load()
	if loadErr != nil {
		log.Fatal("Error loading .env file")
	}

	db, dbErr := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if dbErr != nil {
		log.Fatal("Unable to connect to database.")
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
		
		fmt.Println("Serving static: public/" + relativePath)
		w.Header().Add("Content-Type", mimeType)
		w.Write(bytes)		
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
	
	names := func(w http.ResponseWriter, req *http.Request) {
		people := []Person{}

		rows, qErr := db.Query("select id, name from persons limit 5")
		if qErr != nil {
			log.Fatal(qErr)
			log.Println("Error while executing query.")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			next := Person{}
			scanErr := rows.Scan(&next.Id, &next.Name)
			if scanErr != nil {
				log.Println("Error while reading from result set.")
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			
			people = append(people, next)
		}

		peopleJson, err := json.Marshal(people)
		if err != nil {
			log.Println("Error in names fetch.")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		
		w.Header().Add("Content-Type", "application/json");
		w.Write(peopleJson);
	}

	http.Handle("/", http.HandlerFunc(root))
	http.Handle("/people", http.HandlerFunc(names))
	http.Handle("/public/", http.HandlerFunc(public))

	log.Println("Booting up...")
	
	var addr string = "localhost:8081"
	err = http.ListenAndServe(addr, nil)
	if err != nil {
		log.Fatal("ListenAndServer: ", err)
	}

}
