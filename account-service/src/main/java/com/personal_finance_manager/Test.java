package com.personal_finance_manager;

import java.util.Arrays;
import java.util.function.Function;
import java.util.stream.Collectors;

public class Test {
    public static void main(String[] args) {
//        Base base = new Base("");
//        base.display();
//        System.out.println("---------------");
//        Base baseDerived = new Derived();
//        baseDerived.display();
//        System.out.println("---------------");
//        Derived derived = new Derived();
//        derived.display();
        String[] strings = new String[]{"1","1","2","3","3","3"};
        System.out.println(
                Arrays.stream(strings)
                        .collect(Collectors.groupingBy(Function.identity()))
        );
    }
}



class Base {
    Base(String s) {
        System.out.println("BASE CONSTRUCTOR");
    }
    void display() {
        System.out.println("BASE DISPLAY");
    }
}

class Derived extends Base {
    Derived() {
        super("");
        System.out.println("DERIVED CONSTRUCTOR");
    }
    void display() {
        System.out.println("DERIVED DISPLAY");
    }
}