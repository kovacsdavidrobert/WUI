<?php

enum Permissions : int
{
    case Guest = 0;
    case BlankPass = 5;
    case User = 10;
    case Engineer = 20;
}
