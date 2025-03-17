package com.personal_finance_manager.poc;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.StandardDecryptionMaterial;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class HDFCStatementReader {


    public static void main(String[] args) {
        File pdfFile = new File("src/test/resources/HDFC.pdf");

        try {
            // Load the PDF document
            PDDocument document = PDDocument.load(pdfFile);


            // Create PDFTextStripper instance to extract text
            PDFTextStripper pdfStripper = new PDFTextStripper();

            // Extract text from the document
            String text = pdfStripper.getText(document);

            // Close the document
            document.close();

            // Parse the extracted text into table rows
            List<List<String>> tableData = new ArrayList<>();

            // Print the table data
            for (List<String> row : tableData) {
                System.out.println(row);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    public static void main2(String[] args) {
        File pdfFile = new File("src/test/resources/HDFC.pdf");

        try {
            // Load the PDF document
            PDDocument document = PDDocument.load(pdfFile, "177176484");


            // Create PDFTextStripper instance to extract text
            PDFTextStripper pdfStripper = new PDFTextStripper();

            // Extract text from the document
            String text = pdfStripper.getText(document);

            // Close the document
            document.close();

            // Parse the extracted text into table rows
            List<List<String>> tableData = new ArrayList<>();

            // Print the table data
            for (List<String> row : tableData) {
                System.out.println(row);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
