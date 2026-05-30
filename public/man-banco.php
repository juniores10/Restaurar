<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Banco de Horas - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#mes_p").mask("00/0000");
     $("#dat").mask("00/00/0000");
     $("#dat").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     if (localStorage.ban_t == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('ban_t', 1);
     }

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [5, 'asc'],
               [2, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros no banco de horas ...",
               "sSearch": "Buscar:",
               "infoFiltered": "(Consulta de _TOTAL_/_MAX_ total de linhas)",
               "oPaginate": {
                    sFirst: "Primeiro",
                    sLast: "Último",
                    sNext: "Próximo",
                    sPrevious: "Anterior"
               }
          }
     });

     $('#men-2').css('height', $('#men-3').height() + 'px');
     
     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
          $('#men-2').css('height', $('#men-3').height() + 'px');
     });

     $("#fun").change(function() {
          let ope = 2;
          let cod = $("#fun").val();
          $.getJSON("ajax/fun-car-dados.php", {
                    tip: 5,
                    ope: ope,
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#car').val(data.hor);
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do funcionário");
               });
     });

     $("#dat").blur(function() {
          if ($("#dat").val() == "") {
               var dat = new Date;
               var ddd = ('0' + dat.getDate()).slice(-2);
               var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
               var aaa = dat.getFullYear();
               dat = ddd + "/" + mmm + "/" + (parseFloat(aaa, 10) + 5);
               $('#dat').val(dat);
          }
     });

     $("#pes_f").click(function() {
          $('#frmTelMan').submit();
     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

});
</script>

<?php
     $ret = 0; 
     $per = "";
     $del = "";
     $bot = "Salvar";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
     }

     if (isset($_SESSION['wrkmesano']) == false) { $_SESSION['wrkmesano'] = ""; }
     if (isset($_REQUEST['mes_p']) == true) { $_SESSION['wrkmesano'] = $_REQUEST['mes_p']; }

     if ($_SESSION['wrkopereg'] == 3) { 
          $bot = 'Deletar'; 
          $del = "cor-2";
          $per = ' onclick="return confirm(\'Confirma exclusão de movimento informado em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_dados($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_hor();
               if ($ret == 0) {
                    $ret = incluir_hor();
                    $ret = gravar_log(11,"Inclusão de novo banco: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-banco.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_hor();
               if ($ret == 0) {
                    $ret = alterar_hor();
                    $ret = gravar_log(12,"Alteração de banco existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-banco.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_hor();
               $ret = gravar_log(13,"Exclusão de banco existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-banco.php?ope=1&cod=0"</script>'); 
          }
     }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div id="men-3" class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Manutenção no Banco de Horas</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de banco de horas para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-banco.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um registro de banco dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-banco.php" method="POST">
                         <div  id="tel_c" class="qua-2">
                              <div class="row">
                                   <div class="col-md-1">
                                        <label>Código</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod"
                                             name="cod" value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                                   </div>
                                   <div class="col-md-7">
                                        <label>Nome do Funcionário</label>
                                        <select id="fun" name="fun" class="form-control">
                                             <?php $ret = carrega_col(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Carga Horária Mensal</label>
                                        <input type="text" class="form-control text-center" maxlength="3" id="car"
                                             name="car"
                                             value="<?php echo (isset($_REQUEST['car']) == false ? "" : $_REQUEST['car']); ?>"
                                             disabled />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Status</label>
                                        <select name="sta" class="form-control">
                                             <option value="0"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 0 ? '' : 'selected="selected"'); ?>>
                                                  Normal
                                             </option>
                                             <option value="1"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 1 ? '' : 'selected="selected"'); ?>>
                                                  Bloqueado</option>
                                             <option value="2"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 2 ? '' : 'selected="selected"'); ?>>
                                                  Suspenso</option>
                                             <option value="3"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 3 ? '' : 'selected="selected"'); ?>>
                                                  Cancelado</option>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-6">
                                        <label>Local do Trabalho</label>
                                        <select id="loc" name="loc" class="form-control">
                                             <?php $ret = carrega_loc(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Data</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="dat"
                                             name="dat"
                                             value="<?php echo (isset($_REQUEST['dat']) == false ? "" : $_REQUEST['dat']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Faltas</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="fal"
                                             name="fal"
                                             value="<?php echo (isset($_REQUEST['fal']) == false ? "" : $_REQUEST['fal']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Atrasos</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="atr"
                                             name="atr"
                                             value="<?php echo (isset($_REQUEST['atr']) == false ? "" : $_REQUEST['atr']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Adto</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="adt"
                                             name="adt"
                                             value="<?php echo (isset($_REQUEST['adt']) == false ? "" : $_REQUEST['adt']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Extra</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="ext"
                                             name="ext"
                                             value="<?php echo (isset($_REQUEST['ext']) == false ? "" : $_REQUEST['ext']); ?>" />
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-1">
                                        <label>Entra 1</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="en1"
                                             name="en1"
                                             value="<?php echo (isset($_REQUEST['en1']) == false ? "" : $_REQUEST['en1']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Saída 1</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id=sa1"
                                             name="sa1"
                                             value="<?php echo (isset($_REQUEST['sa1']) == false ? "" : $_REQUEST['sa1']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Entra 2</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="en2"
                                             name="en2"
                                             value="<?php echo (isset($_REQUEST['en2']) == false ? "" : $_REQUEST['en2']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Saída 2</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id=sa2"
                                             name="sa2"
                                             value="<?php echo (isset($_REQUEST['sa2']) == false ? "" : $_REQUEST['sa2']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Entra 3</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="en3"
                                             name="en3"
                                             value="<?php echo (isset($_REQUEST['en3']) == false ? "" : $_REQUEST['en3']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Saída 3</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id=sa3"
                                             name="sa3"
                                             value="<?php echo (isset($_REQUEST['sa3']) == false ? "" : $_REQUEST['sa3']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Entra 4</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="en4"
                                             name="en4"
                                             value="<?php echo (isset($_REQUEST['en1']) == false ? "" : $_REQUEST['en4']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Saída 4</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id=sa4"
                                             name="sa4"
                                             value="<?php echo (isset($_REQUEST['sa4']) == false ? "" : $_REQUEST['sa4']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Entra 5</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="en5"
                                             name="en5"
                                             value="<?php echo (isset($_REQUEST['en5']) == false ? "" : $_REQUEST['en5']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Saída 5</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id=sa5"
                                             name="sa5"
                                             value="<?php echo (isset($_REQUEST['sa1']) == false ? "" : $_REQUEST['sa5']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Entra 6</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id="en6"
                                             name="en6"
                                             value="<?php echo (isset($_REQUEST['en6']) == false ? "" : $_REQUEST['en6']); ?>" />
                                   </div>
                                   <div class="col-md-1">
                                        <label>Saída 6</label>
                                        <input type="text" class="qtd form-control text-center" maxlength="10" id=sa6"
                                             name="sa6"
                                             value="<?php echo (isset($_REQUEST['sa6']) == false ? "" : $_REQUEST['sa6']); ?>" />
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="submit" name="salvar" <?php echo $per; ?>
                                             class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                                   </div>
                                   <div class="col-md-3"></div>
                              </div>
                         </div>
                         <br />
                         <div class="row qua-4">
                         <div class="col-md-2">
                                   <label>Local</label>
                                   <select id="loc_p" name="loc_p" class="form-control">
                                        <?php $ret = carrega_loc(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Setor</label>
                                   <select id="set_p" name="set_p" class="form-control">
                                        <?php $ret = carrega_set(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Cargo</label>
                                   <select id="car_p" name="car_p" class="form-control">
                                        <?php $ret = carrega_car(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Função</label>
                                   <select id="fun_p" name="fun_p" class="form-control">
                                        <?php $ret = carrega_fun(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Mês e Ano</label>
                                   <input type="text" class="form-control text-center" maxlength="7" id="mes_p"
                                        name="mes_p" value="<?php echo $_SESSION['wrkmesano']; ?>" />
                              </div>
                              <div class="col-md-2 text-center"><br />
                                   <button type="button" class="bot-2" id="pes_f" name="pes_f">
                                        <i class="fa fa-search fa-3x" aria-hidden="true"></i>
                                   </button>
                              </div>
                         </div>
                         <br />
                         <div class="container-fluid">
                              <div class="row">
                                   <div class="tab-1 table-responsive">
                                        <table id="tab-0" class="table table-sm table-striped">
                                             <thead>
                                                  <tr>
                                                       <th width="2%" class="text-center">Alterar</th>
                                                       <th width="2%" class="text-center">Excluir</th>
                                                       <th width="2%" class="text-center">Número</th>
                                                       <th>Status</th>
                                                       <th>Local do Trabalho</th>
                                                       <th>Nome do Funcionário</th>
                                                       <th>Data</th>
                                                       <th>Ent-1</th>
                                                       <th>Saí-1</th>
                                                       <th>Ent-2</th>
                                                       <th>Saí-2</th>
                                                       <th>Ent-3</th>
                                                       <th>Saí-3</th>
                                                       <th>Ent-4</th>
                                                       <th>Saí-4</th>
                                                       <th>Ent-5</th>
                                                       <th>Saí-5</th>
                                                       <th>Ent-6</th>
                                                       <th>Saí-6</th>                                                       
                                                       <th>Falta</th>
                                                       <th>Atraso</th>
                                                       <th>Adto</th>
                                                       <th>Extra</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  <?php $ret = carrega_ban();  ?>
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
     </div>
     <div class="row">
          <img class="subir" src="img/subir.png" />
     </div>
</body>
<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idhoras from tb_horas order by idhoras desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idhoras'] + 1;
     }        
     return $cod;
}

function carrega_col() {
     $sta = 0;
     include_once "dados.php";    
     $fun = (isset($_REQUEST['fun']) == false ? "" : $_REQUEST['fun']);
     echo '<option value="0" selected="selected">Selecione funcionário ...</option>';
     $com = "Select idfuncionario, funnome from tb_funcionario order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idfuncionario'] != $fun) {
               echo  '<option value ="' . $lin['idfuncionario'] . '">' . $lin['funnome'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idfuncionario'] . '" selected="selected">' . $lin['funnome'] . '</option>';
          }
     }
     return $sta;
}

function carrega_loc() {
     $sta = 0;
     include_once "dados.php";    
     $loc = (isset($_REQUEST['loc']) == false ? "" : $_REQUEST['loc']);
     echo '<option value="0" selected="selected">Selecione local ...</option>';
     $com = "Select idlocal, locrazao from tb_local where locstatus = 0 order by locrazao, idlocal";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idlocal'] != $loc) {
               echo  '<option value ="' . $lin['idlocal'] . '">' . $lin['locrazao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idlocal'] . '" selected="selected">' . $lin['locrazao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_set() {
     $sta = 0;
     include_once "dados.php";    
     $set = (isset($_REQUEST['set']) == false ? "" : $_REQUEST['set']);
     echo '<option value="0" selected="selected">Selecione setor desejado ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 2 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['iddados'] != $set) {
               echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['iddados'] . '" selected="selected">' . $lin['daddescricao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_car() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione cargo ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 3 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_fun() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione função ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 1 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_ban() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select H.*, L.locrazao, F.funnome, F.funcargo, F.funsetor, F.funfuncao from ((tb_horas H left join tb_funcionario F on H.horfuncionario = F.idfuncionario) left join tb_local L on H.horlocal = L.idlocal) where idhoras > 0 ";
     if (isset($_REQUEST['set_p']) == true) {
          if ($_REQUEST['loc_p'] != 0) { $com .= " and H.horlocal = " . $_REQUEST['loc_p']; }
          if ($_REQUEST['set_p'] != 0) { $com .= " and F.funsetor = " . $_REQUEST['set_p']; }
          if ($_REQUEST['car_p'] != 0) { $com .= " and F.funcargo = " . $_REQUEST['car_p']; }
          if ($_REQUEST['fun_p'] != 0) { $com .= " and F.funfuncao = " . $_REQUEST['fun_p']; }
          if ($_REQUEST['mes_p'] != "") { 
               $mes_p = substr($_REQUEST['mes_p'], 3, 4) . '-' . substr($_REQUEST['mes_p'], 0, 2);
               $com .= " and date_format(H.hordata, '%Y-%m') = '" . $mes_p . "'";
          }          
     }
     $com .= " order by F.funnome, idhoras";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-banco.php?ope=2&cod=' . $lin['idhoras'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-banco.php?ope=3&cod=' . $lin['idhoras'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idhoras'] . '</td>';
          if ($lin['horstatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['horstatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['horstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['horstatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['locrazao'] . '</td>';
          $txt .= '<td>' . $lin['funnome'] . '</td>';
          $txt .= '<td>' . date("d/m/Y", strtotime($lin['hordata'])) . '</td>';
          $txt .= '<td class="text-center">' . $lin['horentra1'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horsaida1'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horentra2'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horsaida2'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horentra3'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horsaida3'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horentra4'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horsaida4'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horentra5'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horsaida5'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horentra6'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horsaida6'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horfalta'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horatraso'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horadto'] . '</td>';
          $txt .= '<td class="text-center">' . $lin['horextra'] . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function consiste_hor() {
     $sta = 0;
     if (trim($_REQUEST['dat']) == "") {
          echo '<script>alert("Data do Movimento não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['fun']) == "" || trim($_REQUEST['fun']) == "0") {
          echo '<script>alert("Nome do Funcionário não pode estar zerado");</script>';
          return 1;
     }
     if (trim($_REQUEST['fal']) != "") {
          if (is_numeric(substr($_REQUEST['fal'],0,2)) == true) {
               if (valida_hor($_REQUEST['fal']) != 0) {
                    echo '<script>alert("Horas de falta informada no movimento não é valida");</script>';
                    return 1;
               }
          }
     }
     if (trim($_REQUEST['atr']) != "") {
          if (is_numeric(substr($_REQUEST['atr'],0,2)) == true) {
               if (valida_hor($_REQUEST['atr']) != 0) {
                    echo '<script>alert("Horas de atraso informada no movimento não é valida");</script>';
                    return 1;
               }
          }
     }
     if (trim($_REQUEST['dat']) != "") {
          if (valida_dat($_REQUEST['dat']) != 0) {
               echo '<script>alert("Data de Movimento informada no usuário não é valida");</script>';
               return 1;
          }
     }
     return $sta;
}

function ler_dados(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_horas where idhoras = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código da Função informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['horstatus'];
          $_REQUEST['fun'] = $reg['horfuncionario'];
          $_REQUEST['loc'] = $reg['horlocal'];
          $_REQUEST['dat'] = date('d/m/Y', strtotime($reg['hordata']));
          $_REQUEST['en1'] = $reg['horentra1'];
          $_REQUEST['sa1'] = $reg['horsaida1'];
          $_REQUEST['en2'] = $reg['horentra2'];
          $_REQUEST['sa2'] = $reg['horsaida2'];
          $_REQUEST['en3'] = $reg['horentra3'];
          $_REQUEST['sa3'] = $reg['horsaida3'];
          $_REQUEST['en4'] = $reg['horentra4'];
          $_REQUEST['sa4'] = $reg['horsaida4'];
          $_REQUEST['en5'] = $reg['horentra5'];
          $_REQUEST['sa5'] = $reg['horsaida5'];
          $_REQUEST['en6'] = $reg['horentra6'];
          $_REQUEST['sa6'] = $reg['horsaida6'];
          $_REQUEST['fal'] = $reg['horfalta'];
          $_REQUEST['atr'] = $reg['horatraso'];
          $_REQUEST['adt'] = $reg['horadto'];
          $_REQUEST['ext'] = $reg['horextra'];
          $_REQUEST['car'] = retorna_dad('funcarga', 'tb_funcionario', 'idfuncionario', $reg['horfuncionario']);
     }
     return $cha;
}

function incluir_hor() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_horas (";
     $sql .= "horstatus, ";
     $sql .= "horfuncionario, ";
     $sql .= "horlocal, ";
     $sql .= "hordata, ";
     $sql .= "horentra1, ";
     $sql .= "horsaida1, ";
     $sql .= "horentra2, ";
     $sql .= "horsaida2, ";
     $sql .= "horentra3, ";
     $sql .= "horsaida3, ";
     $sql .= "horentra4, ";
     $sql .= "horsaida4, ";
     $sql .= "horentra5, ";
     $sql .= "horsaida5, ";
     $sql .= "horentra6, ";
     $sql .= "horsaida6, ";
     $sql .= "horfalta, ";
     $sql .= "horatraso, ";
     $sql .= "horadto, ";
     $sql .= "horextra, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . $_REQUEST['fun'] . "',";
     $sql .= "'" . $_REQUEST['loc'] . "',";
     $sql .= "'" . inverte_dat(0, $_REQUEST['dat']) . "',";
     $sql .= "'" . $_REQUEST['en1'] . "',";
     $sql .= "'" . $_REQUEST['sa1'] . "',";
     $sql .= "'" . $_REQUEST['en2'] . "',";
     $sql .= "'" . $_REQUEST['sa2'] . "',";
     $sql .= "'" . $_REQUEST['en3'] . "',";
     $sql .= "'" . $_REQUEST['sa3'] . "',";
     $sql .= "'" . $_REQUEST['en4'] . "',";
     $sql .= "'" . $_REQUEST['sa4'] . "',";
     $sql .= "'" . $_REQUEST['en5'] . "',";
     $sql .= "'" . $_REQUEST['sa5'] . "',";
     $sql .= "'" . $_REQUEST['en6'] . "',";
     $sql .= "'" . $_REQUEST['sa6'] . "',";
     $sql .= "'" . $_REQUEST['fal'] . "',";
     $sql .= "'" . $_REQUEST['atr'] . "',";
     $sql .= "'" . $_REQUEST['adt'] . "',";
     $sql .= "'" . $_REQUEST['ext'] . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_hor() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_horas set ";
     $sql .= "horstatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "horfuncionario = '". trim($_REQUEST['fun']) . "', ";
     $sql .= "horlocal = '". trim($_REQUEST['loc']) . "', ";
     $sql .= "hordata = '". inverte_dat(0, $_REQUEST['dat']) . "', ";
     $sql .= "horentra1 = '". $_REQUEST['en1'] . "', ";
     $sql .= "horsaida1 = '". $_REQUEST['sa1'] . "', ";
     $sql .= "horentra2 = '". $_REQUEST['en2'] . "', ";
     $sql .= "horsaida2 = '". $_REQUEST['sa2'] . "', ";
     $sql .= "horentra3 = '". $_REQUEST['en3'] . "', ";
     $sql .= "horsaida3 = '". $_REQUEST['sa3'] . "', ";
     $sql .= "horentra4 = '". $_REQUEST['en4'] . "', ";
     $sql .= "horsaida4 = '". $_REQUEST['sa4'] . "', ";
     $sql .= "horentra5 = '". $_REQUEST['en5'] . "', ";
     $sql .= "horsaida5 = '". $_REQUEST['sa5'] . "', ";
     $sql .= "horentra6 = '". $_REQUEST['en6'] . "', ";
     $sql .= "horsaida6 = '". $_REQUEST['sa6'] . "', ";
     $sql .= "horfalta = '". $_REQUEST['fal'] . "', ";
     $sql .= "horatraso = '". $_REQUEST['atr'] . "', ";
     $sql .= "horadto = '". $_REQUEST['adt'] . "', ";
     $sql .= "horextra = '". $_REQUEST['ext'] . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idhoras = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_hor() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_horas where idhoras = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

function calculo_hor($cod_f, $dat_b, $hor_t, &$hor_e, &$hor_a) {
     $ret = 0; $hor_e = 0; $hor_a = 0;
     $hor_t = explode(':', $hor_t);
     if (count($hor_t) == 2) {
          $tot_t = $hor_t[0] * 60 + $hor_t[1];
          $nro = acessa_reg('Select * from tb_funcionario where idfuncionario = ' . $cod_f, $reg);
          if ($nro == 1) {
               $hor_s[0] = $reg['funcarga0'];
               $hor_s[1] = $reg['funcarga1'];
               $hor_s[2] = $reg['funcarga2'];
               $hor_s[3] = $reg['funcarga3'];
               $hor_s[4] = $reg['funcarga4'];
               $hor_s[5] = $reg['funcarga5'];
               $hor_s[6] = $reg['funcarga6'];
          }        
          $sem_n = (int) date('w', strtotime($dat_b));
          $tot_h = $hor_s[$sem_n] * 60;
          if ($tot_h < $tot_t) {
               $hor_e = abs($tot_h - $tot_t);
          } else {
               $hor_a = abs($tot_h - $tot_t);
          }
          if (abs($hor_e <= 10)) { $hor_e = 0;}
          if (abs($hor_a <= 10)) { $hor_a = 0;}
     }
     return $ret;
}
?>

</html>